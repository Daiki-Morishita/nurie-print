import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
