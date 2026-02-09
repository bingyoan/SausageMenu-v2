import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | SausageMenu',
    description: 'Privacy Policy for SausageMenu - AI Menu Translator App',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-12 px-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-stone-800 mb-2">Privacy Policy</h1>
                    <p className="text-stone-500">Last updated: February 2026</p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl shadow-lg p-8 space-y-8">

                    {/* Introduction */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">1</span>
                            Introduction
                        </h2>
                        <p className="text-stone-600 leading-relaxed">
                            SausageMenu (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">2</span>
                            Information We Collect
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-stone-50 rounded-xl p-4">
                                <h3 className="font-bold text-stone-700 mb-2">📧 Email Address</h3>
                                <p className="text-stone-600 text-sm">Used for account authentication and subscription management. We never sell your email to third parties.</p>
                            </div>
                            <div className="bg-stone-50 rounded-xl p-4">
                                <h3 className="font-bold text-stone-700 mb-2">📍 Location Data (Optional)</h3>
                                <p className="text-stone-600 text-sm">Used to save restaurant locations for navigation purposes. Location data is stored locally on your device and only shared with your explicit consent.</p>
                            </div>
                            <div className="bg-stone-50 rounded-xl p-4">
                                <h3 className="font-bold text-stone-700 mb-2">📷 Menu Photos</h3>
                                <p className="text-stone-600 text-sm">Photos are processed by Google Gemini AI for menu translation. Photos are not stored on our servers after processing.</p>
                            </div>
                            <div className="bg-stone-50 rounded-xl p-4">
                                <h3 className="font-bold text-stone-700 mb-2">📊 Usage Statistics</h3>
                                <p className="text-stone-600 text-sm">Anonymous usage data (country, daily usage count) to improve our service. No personally identifiable information is included.</p>
                            </div>
                        </div>
                    </section>

                    {/* How We Use Your Information */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">3</span>
                            How We Use Your Information
                        </h2>
                        <ul className="space-y-2 text-stone-600">
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>To provide and maintain our service</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>To manage your account and subscription</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>To process menu translations using AI</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>To improve user experience based on anonymous analytics</span>
                            </li>
                        </ul>
                    </section>

                    {/* Third-Party Services */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">4</span>
                            Third-Party Services
                        </h2>
                        <p className="text-stone-600 leading-relaxed mb-4">
                            We use the following third-party services:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-stone-200 rounded-xl p-4">
                                <h3 className="font-bold text-stone-700 mb-1">Google Gemini AI</h3>
                                <p className="text-stone-500 text-sm">Menu image analysis and translation</p>
                            </div>
                            <div className="border border-stone-200 rounded-xl p-4">
                                <h3 className="font-bold text-stone-700 mb-1">Google Play Billing</h3>
                                <p className="text-stone-500 text-sm">Subscription payment processing</p>
                            </div>
                            <div className="border border-stone-200 rounded-xl p-4">
                                <h3 className="font-bold text-stone-700 mb-1">Supabase</h3>
                                <p className="text-stone-500 text-sm">Secure user authentication</p>
                            </div>
                            <div className="border border-stone-200 rounded-xl p-4">
                                <h3 className="font-bold text-stone-700 mb-1">Exchange Rate API</h3>
                                <p className="text-stone-500 text-sm">Real-time currency conversion</p>
                            </div>
                        </div>
                    </section>

                    {/* Data Security */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">5</span>
                            Data Security
                        </h2>
                        <p className="text-stone-600 leading-relaxed">
                            We implement industry-standard security measures to protect your data, including HTTPS encryption, secure database storage, and regular security audits. Your API keys are stored locally on your device and never transmitted to our servers.
                        </p>
                    </section>

                    {/* Data Retention */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">6</span>
                            Data Retention
                        </h2>
                        <p className="text-stone-600 leading-relaxed">
                            We retain your account information for as long as your account is active. Menu photos are processed in real-time and not stored. Order history is stored locally on your device.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">7</span>
                            Your Rights
                        </h2>
                        <p className="text-stone-600 leading-relaxed">
                            You have the right to access, correct, or delete your personal data. To exercise these rights, please contact us at the email address below.
                        </p>
                    </section>

                    {/* Children&apos;s Privacy */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">8</span>
                            Children&apos;s Privacy
                        </h2>
                        <p className="text-stone-600 leading-relaxed">
                            Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
                        </p>
                    </section>

                    {/* Contact Us */}
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">9</span>
                            Contact Us
                        </h2>
                        <p className="text-stone-600 leading-relaxed mb-4">
                            If you have any questions about this Privacy Policy, please contact us:
                        </p>
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                            <p className="text-stone-700 font-medium">📧 Email: support@sausagemenu.app</p>
                            <p className="text-stone-700 font-medium mt-1">🌐 Website: https://sausagemenu.zeabur.app</p>
                        </div>
                    </section>

                </div>

                {/* Back Button */}
                <div className="text-center mt-8">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-stone-200 rounded-xl text-stone-600 font-medium hover:border-orange-300 hover:text-orange-600 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to App
                    </a>
                </div>
            </div>
        </div>
    );
}
