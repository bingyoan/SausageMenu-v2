import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support | SausageMenu',
  description: 'Contact SausageMenu support and find help for accounts, subscriptions, camera access, and menu translation.',
};

const supportEmail = 'bingyoan@gmail.com';

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#faf9f7] text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="mb-2 text-sm font-bold text-orange-600">SausageMenu</p>
          <h1 className="text-3xl font-bold">Support / 客服支援</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-stone-600">
            Get help with your account, subscription, camera access, or menu translation.
            如遇到帳號、訂閱、相機權限或菜單翻譯問題，請透過下方方式聯絡我們。
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-10">
        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="text-xl font-bold">Contact Us / 聯絡客服</h2>
          <p className="mt-3 leading-relaxed text-stone-600">
            Email us with your device model, operating system version, a short description of what happened,
            and a screenshot if available. Please never send passwords, verification codes, or API keys.
          </p>
          <a
            href={`mailto:${supportEmail}?subject=SausageMenu%20Support`}
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-orange-600 px-5 font-bold text-white hover:bg-orange-700"
          >
            {supportEmail}
          </a>
          <p className="mt-3 text-sm text-stone-500">We normally reply within two business days.</p>
        </section>

        <section aria-labelledby="faq-heading" className="border-t border-stone-200 pt-10">
          <h2 id="faq-heading" className="text-xl font-bold">Frequently Asked Questions / 常見問題</h2>
          <div className="mt-5 divide-y divide-stone-200 border-y border-stone-200">
            <details className="py-4">
              <summary className="cursor-pointer font-bold">Camera or photo library is unavailable / 無法拍照或選擇照片</summary>
              <p className="mt-3 leading-relaxed text-stone-600">
                Open the device Settings app, select SausageMenu, and allow Camera and Photos access. Then reopen SausageMenu and try again.
              </p>
            </details>
            <details className="py-4">
              <summary className="cursor-pointer font-bold">Subscription is not recognized / 付款後未顯示 PRO</summary>
              <p className="mt-3 leading-relaxed text-stone-600">
                Sign in with the same SausageMenu account used during purchase, open Upgrade PRO, and tap Restore Purchases.
                If access is still missing, contact support with the purchase date and platform. Do not send payment-card details.
              </p>
            </details>
            <details className="py-4">
              <summary className="cursor-pointer font-bold">Manage or cancel an Apple subscription / 管理或取消 Apple 訂閱</summary>
              <p className="mt-3 leading-relaxed text-stone-600">
                Apple manages billing and cancellation. Open Apple subscription settings using the link below.
              </p>
              <a
                href="https://apps.apple.com/account/subscriptions"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block font-bold text-orange-700 underline"
              >
                Manage Apple subscriptions
              </a>
            </details>
            <details className="py-4">
              <summary className="cursor-pointer font-bold">Delete an account / 刪除帳號</summary>
              <p className="mt-3 leading-relaxed text-stone-600">
                In SausageMenu, open Settings, tap Delete Account, review the subscription warning, type DELETE,
                and confirm. This permanently removes the account, profile, AI usage records, and uploaded cloud menus.
                Account deletion does not automatically cancel an App Store subscription.
              </p>
            </details>
          </div>
        </section>

        <section aria-labelledby="links-heading" className="border-t border-stone-200 pt-10">
          <h2 id="links-heading" className="text-xl font-bold">Policies / 政策文件</h2>
          <div className="mt-4 flex flex-wrap gap-5">
            <a href="/privacy" className="font-bold text-orange-700 underline">Privacy Policy</a>
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-orange-700 underline"
            >
              Terms of Use (Apple Standard EULA)
            </a>
          </div>
        </section>

        <a href="/" className="inline-block font-bold text-stone-700 underline">Back to SausageMenu / 返回 App</a>
      </div>
    </main>
  );
}
