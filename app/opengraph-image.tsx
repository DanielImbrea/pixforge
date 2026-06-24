import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PixiqueAi — AI Image Tools';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 16 }}>AI Image Tools</div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>PixiqueAi</div>
        <div style={{ fontSize: 32, opacity: 0.9, maxWidth: 900, lineHeight: 1.4 }}>
          Upscale · Remove Background · Compress · Convert · Resize
        </div>
      </div>
    ),
    { ...size }
  );
}
