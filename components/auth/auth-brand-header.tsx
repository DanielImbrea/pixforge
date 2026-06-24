import { BrandLogo } from '@/components/layout/brand-logo';
import type { Locale } from '@/i18n';

export function AuthBrandHeader({ locale }: { locale: Locale }) {
  return (
    <div className="mb-8 flex justify-center">
      <BrandLogo href={`/${locale}`} height={72} />
    </div>
  );
}
