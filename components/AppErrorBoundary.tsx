'use client';

import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Rendering failed', error, info);
  }

  private recover = () => {
    localStorage.removeItem('current_menu_session');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <section className="w-full max-w-sm text-center">
          <h1 className="mb-3 text-xl font-bold">菜單顯示發生錯誤</h1>
          <p className="mb-6 text-sm leading-6 text-neutral-300">
            這張圖片未能正確建立菜單，請返回首頁後重新拍攝，並讓菜單文字保持清楚、完整且方向正確。
          </p>
          <button
            type="button"
            onClick={this.recover}
            className="w-full bg-orange-500 px-4 py-3 font-bold text-white"
          >
            返回首頁
          </button>
        </section>
      </main>
    );
  }
}
