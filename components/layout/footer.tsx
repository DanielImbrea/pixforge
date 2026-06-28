import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { getEnabledTools } from "@/lib/tools/registry";
import { BrandLogo } from "@/components/layout/brand-logo";
import { BRAND_NAME } from "@/lib/seo/constants";

const footerLinkClass =
  "inline-block text-[13px] leading-relaxed text-text-tertiary transition-[color,transform] duration-200 ease-out hover:text-text-primary hover:-translate-y-px hover:underline underline-offset-[3px] decoration-text-tertiary/40";

const footerHeadingClass =
  "text-sm font-semibold tracking-[-0.01em] text-text-primary";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <p className={`${footerHeadingClass} mb-5`}>{title}</p>
      <ul className="flex flex-col gap-3.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className={footerLinkClass}>
        {children}
      </Link>
    </li>
  );
}

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tools = getEnabledTools();

  return (
    <footer className="mt-8 border-t border-border-default/70 md:mt-16">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid grid-cols-1 gap-y-12 py-20 md:grid-cols-2 md:gap-x-12 md:gap-y-14 lg:grid-cols-[minmax(0,1.45fr)_repeat(4,minmax(0,1fr))] lg:gap-x-16 lg:py-24">
          <div className="md:col-span-2 lg:col-span-1 lg:max-w-[18rem]">
            <BrandLogo href={`/${locale}`} height={48} className="mb-5" />
            <p className="max-w-xs text-sm leading-relaxed text-text-tertiary">
              {t("tagline")}
            </p>
          </div>

          <FooterColumn title={t("tools")}>
            {tools.map((tool) => (
              <FooterLink
                key={tool.id}
                href={`/${locale}/${tool.slug[locale]}`}
              >
                {tool.name[locale]}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={t("company")}>
            <FooterLink href={`/${locale}/about`}>{t("about")}</FooterLink>
            <FooterLink href={`/${locale}/blog`}>{t("blog")}</FooterLink>
            <FooterLink href={`/${locale}/contact`}>{t("contact")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("legal")}>
            <FooterLink href={`/${locale}/legal/terms`}>{t("terms")}</FooterLink>
            <FooterLink href={`/${locale}/legal/privacy`}>
              {t("privacy")}
            </FooterLink>
            <FooterLink href={`/${locale}/legal/cookies`}>
              {t("cookies")}
            </FooterLink>
          </FooterColumn>

          <FooterColumn title={t("support")}>
            <FooterLink href={`/${locale}#faq`}>{t("faq")}</FooterLink>
            <FooterLink href={`/${locale}/contact`}>{t("contact")}</FooterLink>
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-4 border-t border-border-default/70 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs leading-none text-text-tertiary">
            © {new Date().getFullYear()} {BRAND_NAME}. {t("rights")}
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href={`/${locale}/legal/privacy`} className={footerLinkClass}>
              {t("privacy")}
            </Link>
            <Link href={`/${locale}/legal/terms`} className={footerLinkClass}>
              {t("terms")}
            </Link>
            <Link href={`/${locale}/legal/cookies`} className={footerLinkClass}>
              {t("cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
