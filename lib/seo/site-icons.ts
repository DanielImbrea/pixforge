import type { Metadata } from 'next';

const PNG = 'image/png';

/** Shared favicon / touch icon definitions for metadata and web manifest. */
export const SITE_ICON_PATHS = {
  favicon32: '/favicon-32x32.png',
  favicon48: '/favicon-48x48.png',
  favicon96: '/favicon-96x96.png',
  favicon192: '/favicon-192x192.png',
  favicon512: '/favicon-512x512.png',
  appleTouch: '/apple-touch-icon.png',
} as const;

export const siteIcons: NonNullable<Metadata['icons']> = {
  icon: [
    { url: SITE_ICON_PATHS.favicon32, sizes: '32x32', type: PNG },
    { url: SITE_ICON_PATHS.favicon48, sizes: '48x48', type: PNG },
    { url: SITE_ICON_PATHS.favicon96, sizes: '96x96', type: PNG },
    { url: SITE_ICON_PATHS.favicon192, sizes: '192x192', type: PNG },
  ],
  apple: [{ url: SITE_ICON_PATHS.appleTouch, sizes: '192x192', type: PNG }],
  shortcut: SITE_ICON_PATHS.favicon48,
};
