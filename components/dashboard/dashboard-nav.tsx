'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface DashboardNavProps {
  links: { href: string; label: string }[];
}

function isLinkActive(pathname: string, href: string, optimisticHref: string | null): boolean {
  const target = optimisticHref ?? pathname;
  return target === href || target.startsWith(`${href}/`);
}

export function DashboardNav({ links }: DashboardNavProps) {
  const pathname = usePathname();
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = isLinkActive(pathname, link.href, optimisticHref);
        const pending = optimisticHref === link.href && optimisticHref !== pathname;

        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            scroll={false}
            onClick={() => setOptimisticHref(link.href)}
            className={cn(
              'text-sm rounded-md px-3 py-2 transition-colors',
              active
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary',
              pending && 'opacity-80'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
