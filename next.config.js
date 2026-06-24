const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sharp'],
  async redirects() {
    return [
      {
        source: '/:locale(en)/image-upscaler',
        destination: '/:locale/ai-image-upscaler',
        permanent: true,
      },
      {
        source: '/:locale(en)/background-removal',
        destination: '/:locale/background-remover',
        permanent: true,
      },
      {
        source: '/:locale(en)/png-to-jpg',
        destination: '/:locale/image-converter',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
