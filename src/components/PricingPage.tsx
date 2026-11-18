import React from 'react';
import { ArrowRight, Check, ExternalLink, KeyRound, RotateCcw } from 'lucide-react';
import type { UsageState } from '../utils/draftStorage';
import { PAYHIP_CHECKOUT_URL } from '../config/licenses';

interface PricingPageProps {
  usage: UsageState;
  onOpenLicenseModal: () => void;
  onResetQuota: () => void;
  onGoAudit: () => void;
}

const COMPARISON_ROWS = [
  {
    feature: 'Audits SEO complets de boutique',
    free: '1 audit gratuit inclus',
    premium: 'Illimités (toutes boutiques)',
  },
  {
    feature: 'Mots-clés transactionnels par audit',
    free: '10 à 14 mots-clés',
    premium: '10 à 14 mots-clés + suivi mensuel',
  },
  {
    feature: 'Générateur de contenu (fiches, catégories, blog, FAQ)',
    free: 'Accès découverte',
    premium: 'Génération illimitée + brouillons locaux',
  },
  {
    feature: 'Analyse Google Search Console (CSV & saisie)',
    free: '6–8 recommandations',
    premium: '6–8 recommandations + exports avancés',
  },
  {
    feature: 'Exports PDF & HTML professionnels',
    free: 'Inclus',
    premium: 'Inclus + format marque blanche',
  },
  {
    feature: 'Plateformes supportées',
    free: 'Shopify, WooCommerce, PrestaShop',
    premium: 'Shopify, WooCommerce, PrestaShop, Sur-mesure',
  },
];

export const PricingPage: React.FC<PricingPageProps> = ({
  usage,
  onOpenLicenseModal,
  onResetQuota,
  onGoAudit,
}) => {
  const freeRemaining = Math.max(0, 1 - usage.freeAuditsUsed);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
            Tarifs simples pour boutiques e-commerce
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Testez votre boutique avec 1 audit complet gratuit sans carte bancaire, puis passez à Premium pour auditer vos concurrents et générer vos contenus en illimité.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Statut actuel :{' '}
          <strong className="text-slate-900 dark:text-slate-100">
            {usage.plan === 'premium'
              ? 'Plan Premium actif'
              : `${freeRemaining} audit gratuit disponible`}
          </strong>
        </div>
      </div>

      {/* Pricing Tier Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Free Tier */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pour découvrir sur votre boutique
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              Découverte Gratuit
            </h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                0 €
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                · 1 audit complet offert
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Idéal pour diagnostiquer votre site Shopify, WooCommerce ou PrestaShop et obtenir vos 10 à 14 premiers mots-clés transactionnels.
            </p>

            <ul className="mt-6 space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>1 audit SEO technique &amp; sémantique complet</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Générateur de fiches produits, catégories, blog et FAQ</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Analyse d’export CSV Google Search Console</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Export PDF et HTML instantané</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGoAudit}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              {freeRemaining > 0 ? 'Utiliser mon audit gratuit' : 'Retour à l’audit'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            {usage.freeAuditsUsed > 0 && usage.plan === 'free' && (
              <button
                type="button"
                onClick={onResetQuota}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Réinitialiser l’essai
              </button>
            )}
          </div>
        </section>

        {/* Premium Tier */}
        <section className="flex flex-col justify-between rounded-xl border-2 border-teal-700 dark:border-teal-600 bg-white dark:bg-slate-900 p-6 sm:p-8">
          <div>
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              Pour boutiques en croissance &amp; agences
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              Premium Croissance
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Conçu pour les e-commerçants qui déploient de nouvelles collections chaque mois et suivent leurs concurrents de près.
            </p>

            <ul className="mt-6 space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Audits SEO illimités pour votre boutique et vos concurrents</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Production illimitée de fiches produits, collections, articles et FAQ</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Suivi mensuel des exports Google Search Console sans limite de lignes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Exports PDF et HTML complets prêts pour votre équipe ou vos clients</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            {usage.plan === 'premium' ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Premium activé ! 🎉{usage.licenseKey ? ` (${usage.licenseKey})` : ''}
                </span>
                <button
                  type="button"
                  onClick={onResetQuota}
                  className="text-xs font-medium text-slate-500 underline hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Revenir au plan gratuit
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <a
                  href={PAYHIP_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap"
                >
                  Activer Premium
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={onOpenLicenseModal}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  J’ai déjà ma clé
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Comparison Matrix */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Comparatif détaillé des fonctionnalités
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="pb-3 pr-4">Capacité</th>
                <th className="pb-3 pr-4">Découverte Gratuit</th>
                <th className="pb-3">Premium Croissance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">
                    {row.feature}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                    {row.free}
                  </td>
                  <td className="py-3 font-medium text-teal-700 dark:text-teal-400">
                    {row.premium}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
