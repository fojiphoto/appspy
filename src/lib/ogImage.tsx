import { ImageResponse } from 'next/og';

/**
 * The 1200x630 card that link previews show (WhatsApp, LinkedIn, X, Slack, Facebook).
 *
 * Without an og:image a shared AppSpy link showed as bare text: the site had no Open Graph tags
 * at all. Each route's opengraph-image.tsx and twitter-image.tsx call this with their own words,
 * and Next adds the og:image, its width and height, and twitter:image tags from those files.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

export function ogImage(title: string, subtitle: string, points: string[] = []) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '64px 72px', color: '#ffffff',
          background: 'linear-gradient(135deg, #0d0f14 0%, #171a2b 55%, #2a1a52 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 34, fontWeight: 700 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, marginRight: 20,
              borderRadius: 16, background: '#7c3aed', fontSize: 30, fontWeight: 800,
            }}
          >
            FS
          </div>
          AppSpy
          <span style={{ marginLeft: 16, color: '#a5a8c0', fontWeight: 400 }}>by Factorial Studio</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 74, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 32, color: '#c7c9dd', lineHeight: 1.3 }}>{subtitle}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 26 }}>
          <div style={{ display: 'flex' }}>
            {points.map((p) => (
              <div
                key={p}
                style={{
                  display: 'flex', marginRight: 14, padding: '10px 20px', borderRadius: 999,
                  border: '2px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#e6e7f5',
                }}
              >
                {p}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', color: '#a5a8c0' }}>appspy.factorialstudio.com</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
