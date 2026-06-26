import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { calculateAllPlansEconomics } from '@/lib/billing/unit-economics';
import { Card } from '@/components/ui/card';

export async function AdminEconomicsPanel({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'admin' });
  const plans = calculateAllPlansEconomics();

  return (
    <Card>
      <h2 className="text-lg font-medium text-text-primary mb-1">{t('economicsTitle')}</h2>
      <p className="text-sm text-text-secondary mb-6">{t('economicsDescription')}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border-default text-text-tertiary">
              <th className="py-2 pr-4">{t('economicsPlan')}</th>
              <th className="py-2 pr-4">{t('economicsRevenue')}</th>
              <th className="py-2 pr-4">{t('economicsMaxCost')}</th>
              <th className="py-2 pr-4">{t('economicsMargin')}</th>
              <th className="py-2">{t('economicsStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((row) => (
              <tr key={row.plan} className="border-b border-border-default/60">
                <td className="py-3 pr-4 capitalize font-medium text-text-primary">{row.plan}</td>
                <td className="py-3 pr-4 text-text-secondary">€{row.netRevenueEur.toFixed(2)}</td>
                <td className="py-3 pr-4 text-text-secondary">€{row.estimatedMaxCostEur.toFixed(2)}</td>
                <td className="py-3 pr-4 text-text-secondary">
                  €{row.estimatedMarginEur.toFixed(2)} ({row.marginPercent.toFixed(0)}%)
                </td>
                <td className="py-3">
                  <span className={row.profitableAtMaxUsage ? 'text-success' : 'text-danger'}>
                    {row.profitableAtMaxUsage ? t('economicsProfitable') : t('economicsLoss')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-tertiary mt-4">{t('economicsFootnote')}</p>
    </Card>
  );
}
