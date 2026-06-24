import Link from 'next/link';
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/seo/constants';
import { cn } from '@/lib/utils/cn';

type BrandLogoSize = 'sm' | 'md' | 'lg';

const HEIGHTS: Record<BrandLogoSize, number> = {
  sm: 44,
  md: 52,
  lg: 60,
};

const LOGO_ASPECT = 680 / 220;

interface BrandLogoProps {
  href?: string;
  size?: BrandLogoSize;
  /** Override preset size (px height). */
  height?: number;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ href, size = 'md', height: heightOverride, className, priority }: BrandLogoProps) {
  const height = heightOverride ?? HEIGHTS[size];

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME}
      height={height}
      width={Math.round(height * LOGO_ASPECT)}
      className={cn('w-auto max-w-none object-contain object-left', className)}
      style={{ height }}
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center" aria-label={BRAND_NAME}>
        {image}
      </Link>
    );
  }

  return image;
}
