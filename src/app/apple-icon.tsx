import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFF3E0',
          borderRadius: 36,
          gap: 12,
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#E66A2C' }} />
        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#4FA7B8' }} />
        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#E8B838' }} />
      </div>
    ),
    { ...size }
  )
}
