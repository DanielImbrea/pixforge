'use client';

import { useEffect } from 'react';

/** Ensures the app stays on the default light theme. */
export function LightModeOnly() {
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
  }, []);

  return null;
}
