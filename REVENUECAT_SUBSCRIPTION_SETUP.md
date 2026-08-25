# RevenueCat APP Purchase Setup

This project intentionally keeps two different entitlements:

- `users.is_pro`: legacy web/BYOK lifetime access only.
- `users.app_subscription_*`: iOS and Android purchases backed by RevenueCat.

Legacy web access must never be copied into `app_subscription_status`.

## 1. Run the Supabase migration

Open Supabase SQL Editor and run `supabase_migration.sql` before deploying this build.

The migration creates a private, stable UUID for each RevenueCat customer and
adds the APP-only subscription columns.

## 2. Configure store products

Create matching one-time lifetime products in App Store Connect and Google Play:

| Platform | Store product ID | Price |
| --- | --- | ---: |
| Apple | `Sausagemenulifetime` | USD 9.99 |
| Google Play | `sm_lifetime` | USD 9.99 |

In RevenueCat:

1. Import both platform products and attach them to entitlement `pro`.
2. Add the predefined `$rc_lifetime` package to the Current Offering.
3. Attach the Apple lifetime product to `$rc_lifetime` on iOS and the Google lifetime product to `$rc_lifetime` on Android.
4. Remove monthly/yearly packages from the Current Offering only. Do not delete the old store products; existing subscribers must be able to renew.

The APP paywall now shows only `$rc_lifetime`. The store controls the localized
price shown in the APP; USD 9.99 is the base price configured in each store.

The server accepts a lifetime product only when RevenueCat reports a matching
`non_subscriptions` store transaction for the same RevenueCat App User ID. A
manual promotional grant is never treated as lifetime access.

To manually grant a creator six or twelve months of APP PRO, add a promotional
entitlement for `pro` in RevenueCat and choose an explicit expiration date.
RevenueCat reports this with an `rc_promo_` product prefix. The server accepts it only while
that finite expiration is in the future; a promotion without an expiration or
an expired promotion is rejected. Lifetime store purchases and promotional
grants are evaluated independently.

## 3. Configure Zeabur environment variables

Set these on the Zeabur service that serves the APP:

```text
NEXT_PUBLIC_REVENUECAT_APPLE_KEY=appl_...
NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_...
NEXT_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
REVENUECAT_ENTITLEMENT_ID=pro
NEXT_PUBLIC_REVENUECAT_LIFETIME_PRODUCT_IDS=Sausagemenulifetime,sm_lifetime
REVENUECAT_LIFETIME_PRODUCT_IDS=Sausagemenulifetime,sm_lifetime
REVENUECAT_SECRET_API_KEY=sk_...
REVENUECAT_WEBHOOK_AUTH=Bearer <a-long-random-secret>
AUTH_SESSION_SECRET=<at-least-32-random-characters>
GEMINI_GLOBAL_DAILY_PAGE_LIMIT=5000
```

- Public Apple/Google SDK keys: RevenueCat Project Settings > API keys > App-specific keys.
- Secret API key: RevenueCat Project Settings > API keys > Secret API keys. It must be a server-only key allowed to read customers. The server prefers this key and uses the platform SDK keys as read-only RevenueCat API v1 fallbacks.
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

Creator attribution is feature-gated until both stores have a verified first-year
offer. Set `NEXT_PUBLIC_CREATOR_OFFERS_ENABLED=true` only after the Apple offer-code
flow and Google `creator20` subscription option are connected and sandbox-tested.
Run `supabase_creator_affiliate_migration.sql` before enabling it. RevenueCat
`INITIAL_PURCHASE` events for annual products create a 45-day pending commission;
renewals, monthly products, and promotional `rc_promo_` grants never do.
The lifetime-only paywall does not display annual creator codes. Lifetime referral
discounts/commissions would require a separate one-time-product design.

The APP also re-checks RevenueCat through its server on every login/app launch,
so subscription status still refreshes if a webhook is delayed. Webhooks remain
recommended because they update cancellations and expirations without waiting
for the customer to reopen the APP.

If RevenueCat HMAC signing is enabled, store its one-time signing secret as
`REVENUECAT_WEBHOOK_SIGNING_SECRET`. When present, HMAC verification takes
priority over the authorization header.

## 5. Verification checklist

1. Sign in to a fresh account on Android.
2. Confirm the paywall shows only Lifetime PRO and no auto-renewal text.
3. Buy the USD 9.99 one-time product in the Google license-test account.
4. Check `users.app_subscription_status = active`, `app_subscription_product_id = sm_lifetime`, and `app_subscription_expires_at IS NULL`.
5. Sign in with the same account on iOS and confirm access is restored.
6. Buy/restore the Apple USD 9.99 one-time product in StoreKit/TestFlight and verify the same fields with the Apple product ID.
7. Confirm a legacy row with only `is_pro = true` does not unlock APP purchase features.
8. Confirm free accounts stop after 3 successful lifetime translations.
9. Confirm paid accounts stop at 20 successful translations/day or 60/month. Each translation may contain 1-4 pages and consumes one use only after the batch succeeds.
10. Grant a test customer a dated `pro` promotional entitlement and confirm APP PRO expires at the same timestamp.
11. Confirm an undated `rc_promo_...` entitlement does not unlock APP PRO.
