import { NextRequest, NextResponse } from 'next/server';

/**
 * TTS Proxy API
 * 代理 Google Translate TTS 請求，繞過瀏覽器 CORS 限制
 * 路由: GET /api/tts?text=...&lang=ja
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en';

    if (!text) {
        return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    // 限制文字長度，避免濫用
    if (text.length > 200) {
        return NextResponse.json({ error: 'Text too long (max 200 chars)' }, { status: 400 });
    }

    try {
        const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;

        const response = await fetch(googleTTSUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/',
            },
        });

        if (!response.ok) {
            console.error(`[TTS API] Google TTS returned ${response.status}`);
            return NextResponse.json({ error: 'TTS service unavailable' }, { status: 502 });
        }

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=86400', // 快取 24 小時
            },
        });
    } catch (error) {
        console.error('[TTS API] Error:', error);
        return NextResponse.json({ error: 'TTS proxy failed' }, { status: 500 });
    }
}
