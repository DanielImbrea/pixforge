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
      {
        source: '/:locale(ro)/png-in-jpg',
        destination: '/:locale/convertor-jpg-png',
        permanent: true,
      },
      {
        source: '/:locale(ro)/upscalare-poze',
        destination: '/:locale/upscale-ai',
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
