import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { PLAN_LIMITS, PLAN_ORDER, formatPlanPrice } from "@/lib/billing/plans";
import { getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditsLegend } from "@/components/billing/credits-legend";
import { PlanCardCta } from "@/components/billing/plan-card-cta";

export async function LandingPricingPreview({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "pricing" });
  const tHome = await getTranslations({ locale, namespace: "home" });
  const user = await getCurrentUser();

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          {t("heading")}
        </h2>
        <p className="text-text-secondary">{t("subheading")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {PLAN_ORDER.map((tier) => {
          const config = PLAN_LIMITS[tier];
          const isCurrent = user?.plan === tier;
          const creditsLabel =
            config.periodType === "daily"
              ? t("creditsPerDay", { count: config.creditsPerPeriod })
              : t("creditsPerMonth", { count: config.creditsPerPeriod });

          return (
            <Card key={tier} className="flex flex-col h-full">
              <h3 className="text-lg font-medium text-text-primary mb-1">
                {t(tier)}
              </h3>
              <p className="text-2xl font-semibold text-text-primary mb-1">
                {formatPlanPrice(config, locale)}
                {config.price.amount > 0 && (
                  <span className="text-sm text-text-tertiary">
                    {t("perMonth")}
                  </span>
                )}
              </p>
              <p className="text-sm text-text-secondary mb-4">{creditsLabel}</p>
              <ul className="space-y-2 text-sm text-text-secondary mb-4">
                <li>{t("maxUploadPerFile", { mb: config.maxUploadMB })}</li>
                <li>
                  {config.watermark ? t("watermarkedOutput") : t("noWatermark")}
                </li>
                <li>
                  {config.hdDownloads
                    ? t("hdDownloads")
                    : t("standardDownloads")}
                </li>
                {config.batchProcessing && <li>{t("batchProcessing")}</li>}
                {config.commercialLicense && <li>{t("commercialLicense")}</li>}
              </ul>
              <p className="text-xs text-text-tertiary mb-4">
                {tHome(`planHighlight_${tier}` as "planHighlight_free")}
              </p>
              <PlanCardCta
                tier={tier}
                locale={locale}
                isLoggedIn={Boolean(user)}
                isCurrent={isCurrent}
              />
            </Card>
          );
        })}
      </div>

      <CreditsLegend locale={locale} />

      <div className="text-center mt-8">
        <Link href={`/${locale}/pricing`}>
          <Button variant="secondary">{tHome("pricingCompareCta")}</Button>
        </Link>
      </div>
    </div>
  );
}
