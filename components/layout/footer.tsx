import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { getEnabledTools } from "@/lib/tools/registry";
import { BrandLogo } from "@/components/layout/brand-logo";
import { BRAND_NAME } from "@/lib/seo/constants";

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tools = getEnabledTools();

  return (
    <footer className="border-t border-border-default mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <BrandLogo href={`/${locale}`} height={52} className="mb-4" />
          <p className="text-sm text-text-tertiary">{t("tagline")}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">
            {t("tools")}
          </p>
          <ul className="space-y-2">
            {tools.map((tool) => (
              <li key={tool.id}>
                <Link
                  href={`/${locale}/${tool.slug[locale]}`}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  {tool.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">
            {t("company")}
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                href={`/${locale}/about`}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t("about")}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/blog`}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t("blog")}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/contact`}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">
            {t("legal")}
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                href={`/${locale}/legal/terms`}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/legal/privacy`}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/legal/cookies`}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t("cookies")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">
            {t("support")}
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                href={`/${locale}#faq`}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t("faq")}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/contact`}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-border-default flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-text-tertiary">
        <span>
          © {new Date().getFullYear()} {BRAND_NAME}. {t("rights")}
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href={`/${locale}/legal/privacy`}
            className="hover:text-text-secondary"
          >
            {t("privacy")}
          </Link>
          <Link
            href={`/${locale}/legal/terms`}
            className="hover:text-text-secondary"
          >
            {t("terms")}
          </Link>
          <Link
            href={`/${locale}/legal/cookies`}
            className="hover:text-text-secondary"
          >
            {t("cookies")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
