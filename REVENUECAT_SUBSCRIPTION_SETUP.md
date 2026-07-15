# RevenueCat APP Subscription Setup

This project intentionally keeps two different entitlements:

- `users.is_pro`: legacy web/BYOK lifetime access only.
- `users.app_subscription_*`: iOS and Android subscriptions backed by RevenueCat.

Legacy web access must never be copied into `app_subscription_status`.

## 1. Run the Supabase migration

Open Supabase SQL Editor and run `supabase_migration.sql` before deploying this build.

The migration creates a private, stable UUID for each RevenueCat customer and
adds the APP-only subscription columns.

## 2. Configure store products

Create matching auto-renewing subscriptions in App Store Connect and Google Play:

| Package | RevenueCat package | Taiwan price |
| --- | --- | ---: |
| Monthly | `$rc_monthly` | TWD 299 |
| Annual | `$rc_annual` | TWD 2,390 |

In RevenueCat:

1. Attach both platform products to entitlement `pro`.
2. Add both packages to the Current Offering.
3. Remove the lifetime package from the Current Offering.
4. Use the predefined `$rc_monthly` and `$rc_annual` package identifiers.

The APP reads `product.priceString` from the store. The crossed-out annual
reference price is calculated from the current monthly store price multiplied
by 12, so TWD 299 displays a TWD 3,588 reference price.

## 3. Configure Zeabur environment variables

Set these on the Zeabur service that serves the APP:

```text
NEXT_PUBLIC_REVENUECAT_APPLE_KEY=appl_...
NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_...
NEXT_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
REVENUECAT_ENTITLEMENT_ID=pro
REVENUECAT_SECRET_API_KEY=sk_...
REVENUECAT_WEBHOOK_AUTH=Bearer <a-long-random-secret>
AUTH_SESSION_SECRET=<at-least-32-random-characters>
GEMINI_GLOBAL_DAILY_PAGE_LIMIT=5000
```

- Public Apple/Google SDK keys: RevenueCat Project Settings > API keys > App-specific keys.
- Secret API key: RevenueCat Project Settings > API keys > Secret API keys. It must be a server-only key allowed to read customers.
- Webhook auth value: generate a new random value. Include the `Bearer ` prefix in both Zeabur and RevenueCat.
- Session secret: generate a separate random value of at least 32 characters. It signs the secure login cookie and must remain server-only.
- Global daily page limit: emergency server-wide ceiling. Start conservatively and adjust after reviewing real token costs.

Do not put `REVENUECAT_SECRET_API_KEY` or the webhook secret in any
`NEXT_PUBLIC_` variable.

## 4. Configure the RevenueCat webhook

RevenueCat > Integrations > Webhooks:

```text
URL: https://sausagemenu-v2.zeabur.app/api/revenuecat/webhook
Authorization header: same complete value as REVENUECAT_WEBHOOK_AUTH
Environment: Production and Sandbox while testing
```

Send a test webhook after deployment. A successful request returns HTTP 200.

The APP also re-checks RevenueCat through its server on every login/app launch,
so subscription status still refreshes if a webhook is delayed. Webhooks remain
recommended because they update cancellations and expirations without waiting
for the customer to reopen the APP.

If RevenueCat HMAC signing is enabled, store its one-time signing secret as
`REVENUECAT_WEBHOOK_SIGNING_SECRET`. When present, HMAC verification takes
priority over the authorization header.

## 5. Verification checklist

1. Sign in to a fresh account on Android.
2. Confirm the paywall shows Monthly first and Annual second.
3. Confirm store prices are TWD 299 and TWD 2,390 in the Taiwan test account.
4. Confirm Annual shows the crossed-out TWD 3,588 reference price.
5. Buy in sandbox and check `users.app_subscription_status = active`.
6. Sign in with the same account on iOS and confirm access is restored.
7. Cancel/expire the sandbox subscription and confirm the webhook updates the database.
8. Confirm a legacy row with only `is_pro = true` does not unlock APP subscription features.
9. Confirm free accounts stop after 3 lifetime pages.
10. Confirm paid accounts stop at 20 pages/day or 60 pages/month, with a maximum of 4 pages per upload.
