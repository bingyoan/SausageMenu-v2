import { Capacitor, CapacitorHttp } from '@capacitor/core';

const API_ORIGIN = 'https://sausagemenu-v2.zeabur.app';
let installed = false;

const getRelativeApiPath = (input: RequestInfo | URL) => {
  if (typeof input === 'string' && input.startsWith('/api/')) return input;
  if (input instanceof URL && input.pathname.startsWith('/api/')) return `${input.pathname}${input.search}`;
  if (typeof Request !== 'undefined' && input instanceof Request) {
    const url = new URL(input.url);
    if (url.pathname.startsWith('/api/')) return `${url.pathname}${url.search}`;
  }
  return undefined;
};

const headersToObject = (headers?: HeadersInit) => {
  if (!headers) return {};
  return Object.fromEntries(new Headers(headers).entries());
};

export const installNativeApiFetch = () => {
  if (installed || typeof window === 'undefined' || !Capacitor.isNativePlatform()) return;
  installed = true;

  const browserFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const apiPath = getRelativeApiPath(input);
    if (!apiPath) return browserFetch(input, init);

    const method = (init.method || (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')).toUpperCase();
    const response = await CapacitorHttp.request({
      url: `${API_ORIGIN}${apiPath}`,
      method,
      headers: headersToObject(init.headers),
      data: init.body,
      connectTimeout: 15000,
      readTimeout: 120000,
      responseType: 'text',
    });

    const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data ?? null);
    return new Response(body, {
      status: response.status,
      headers: response.headers as Record<string, string>,
    });
  };
};
