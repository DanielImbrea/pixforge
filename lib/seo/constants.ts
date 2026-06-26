export const SITE_URL =
  process.env.APP_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';

export const PRODUCTION_SITE_URL = 'https://www.pixiqueai.com';

export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: 'PixiqueAi — AI Image Tools',
};

export const BRAND_NAME = 'PixiqueAi';

export const BRAND_LOGO_SRC = '/demo/pixique_ai_logo.png';
