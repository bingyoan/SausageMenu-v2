'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

// 內部組件，使用 useSearchParams
function PurchaseSuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (sessionId) {
            // 模擬確認付款成功
            setTimeout(() => {
                setStatus('success');
            }, 1500);
        } else {
            setStatus('error');
        }
    }, [sessionId]);

    return (
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
            {status === 'loading' && (
                <div className="space-y-4">
                    <Loader2 size={64} className="mx-auto text-sausage-500 animate-spin" />
                    <h1 className="text-2xl font-bold text-gray-800">確認付款中...</h1>
                    <p className="text-gray-500">請稍候</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={48} className="text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">🎉 購買成功！</h1>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-gray-600">
                            你的推薦碼將在 <strong>幾分鐘內</strong> 發送到你的 Email
                        </p>
                        <p className="text-sm text-gray-400">
                            請檢查你的收件匣（包括垃圾郵件）
                        </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                        <p className="text-amber-800 text-sm">
                            <strong>💡 小提醒：</strong><br />
                            你可以把這組推薦碼以 NT$200 賣給朋友，<br />
                            賺取 NT$80 的利潤！
                        </p>
                    </div>
                    <a
                        href="/"
                        className="inline-block mt-4 px-6 py-3 bg-sausage-500 hover:bg-sausage-600 text-white font-bold rounded-xl transition-colors"
                    >
                        返回首頁
                    </a>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle size={48} className="text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">發生錯誤</h1>
                    <p className="text-gray-500">無法確認付款狀態，請聯繫客服</p>
                    <a
                        href="/"
                        className="inline-block mt-4 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                    >
                        返回首頁
                    </a>
                </div>
            )}
        </div>
    );
}

// 外部頁面組件，使用 Suspense 包裝
export default function PurchaseSuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-sausage-50 to-orange-50 flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <Loader2 size={64} className="mx-auto text-sausage-500 animate-spin" />
                    <h1 className="text-2xl font-bold text-gray-800 mt-4">載入中...</h1>
                </div>
            }>
                <PurchaseSuccessContent />
            </Suspense>
        </div>
    );
}
