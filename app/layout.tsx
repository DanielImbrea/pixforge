import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PRODUCTION_SITE_URL } from '@/lib/seo/constants';
import { siteIcons } from '@/lib/seo/site-icons';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_SITE_URL),
  icons: siteIcons,
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
