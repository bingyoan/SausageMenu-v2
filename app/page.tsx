"use client";

import React from 'react';
import App from '../App';
import { AppErrorBoundary } from '../components/AppErrorBoundary';

// ========================================
// 🚀 APP 商店版本 - 直接進入主 App
// ========================================
// 移除了 Landing Page 和語言選擇畫面
// 讓 Native App 直接進入主應用程式
// ========================================

export default function Page() {
    return (
        <AppErrorBoundary>
            <App />
        </AppErrorBoundary>
    );
}
