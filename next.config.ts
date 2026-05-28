import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/category/type/maze', destination: '/maze', permanent: true },
      // /upgrade は有料プラン未実装のため非公開化。リンク残存に備え /materials へ恒久リダイレクト
      { source: '/upgrade', destination: '/materials', permanent: true },
      // 季節テーマ統合: autumn/winter は seasonal-events に統合
      { source: '/category/theme/autumn', destination: '/category/theme/seasonal-events', permanent: true },
      { source: '/category/theme/winter', destination: '/category/theme/seasonal-events', permanent: true },
    ]
  },
  serverExternalPackages: ['sharp'],
  // 画像最適化は全Imageでスキップ（Vercel無料枠の5,000変換/月を節約）
  // 素材画像はSupabase CDN、ローカル画像はSVG/最適済JPGなので最適化不要
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hdhogsjmdowevijxooiq.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // ターボパック設定（ルート指定で警告を抑制）
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
