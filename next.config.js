const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sharp', '@vladmandic/face-api'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@vladmandic/face-api': '@vladmandic/face-api/dist/face-api.esm.js',
      };
    }
    return config;
  },
  outputFileTracingIncludes: {
    '/api/jobs/[id]/process/route': [
      './lib/vendor/face-api-model/**/*',
      './node_modules/@vladmandic/face-api/dist/**/*',
    ],
    '/api/upload/route': ['./lib/vendor/face-api-model/**/*'],
    '/api/v1/jobs/[id]/route': [
      './lib/vendor/face-api-model/**/*',
      './node_modules/@vladmandic/face-api/dist/**/*',
    ],
  },
  async redirects() {
    const blogRedirects = [
      ['ai-image-upscaling-guide', 'upscale-low-resolution-images-with-ai'],
      ['how-to-remove-background', 'remove-background-without-photoshop'],
      ['image-compression-guide', 'compress-images-without-losing-quality'],
    ].flatMap(([from, to]) => [
      { source: `/en/blog/${from}`, destination: `/en/blog/${to}`, permanent: true },
      { source: `/ro/blog/${from}`, destination: `/ro/blog/${to}`, permanent: true },
    ]);

    return [
      ...blogRedirects,
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
