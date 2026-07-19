"use client";

import { useEffect } from "react";

const CrispChat = () => {
  useEffect(() => {
    const crispWindow = window as typeof window & {
      $crisp?: unknown[];
      CRISP_WEBSITE_ID?: string;
    };
    crispWindow.$crisp = crispWindow.$crisp || [];
    crispWindow.CRISP_WEBSITE_ID = "acc6c5c7-422d-4f8e-bdb6-dd2d837da90e";

    if (!document.querySelector('script[data-sausagemenu-crisp]')) {
      const script = document.createElement('script');
      script.src = 'https://client.crisp.chat/l.js';
      script.async = true;
      script.dataset.sausagemenuCrisp = 'true';
      document.head.appendChild(script);
    }
  }, []);

  return null;
};

export default CrispChat;
