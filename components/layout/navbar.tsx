import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { getCurrentUser } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NavbarMenu } from "@/components/layout/navbar-menu";

export async function Navbar({ locale }: { locale: Locale }) {
  const user = await getCurrentUser();
  const otherLocale: Locale = locale === "en" ? "ro" : "en";

  return (
    <header className="border-b border-border-default bg-background-primary sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[4rem] md:min-h-[4.5rem] py-2 flex items-center justify-between gap-3">
        <div className="shrink min-w-0 max-w-[calc(100%-3.5rem)]">
          <div className="md:hidden">
            <BrandLogo
              href={user ? `/${locale}/dashboard` : `/${locale}`}
              height={56}
              priority
            />
          </div>
          <div className="hidden md:block">
            <BrandLogo
              href={user ? `/${locale}/dashboard` : `/${locale}`}
              height={56}
              priority
            />
          </div>
        </div>

        <NavbarMenu
          locale={locale}
          isLoggedIn={!!user}
          otherLocale={otherLocale}
        />
      </div>
    </header>
  );
}
