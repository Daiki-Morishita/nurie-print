'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body style={{
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#FAF7F0',
        color: '#3A3A3A',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{
            fontSize: 11,
            color: '#C75C3A',
            letterSpacing: '0.2em',
            marginBottom: 8,
            fontWeight: 700,
          }}>
            — Critical Error —
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: '8px 0 16px', lineHeight: 1.4 }}>
            申し訳ありません
          </h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.7 }}>
            サイトに重大なエラーが発生しました。<br />
            時間をおいて再度お試しください。
            {error.digest && (
              <span style={{ display: 'block', marginTop: 12, fontSize: 11, fontFamily: 'monospace', color: '#999' }}>
                ref: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              background: '#C75C3A',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              marginRight: 8,
            }}
          >
            もう一度試す
          </button>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              color: '#3A3A3A',
              textDecoration: 'none',
            }}
          >
            ホームに戻る
          </a>
        </div>
      </body>
    </html>
  )
}
