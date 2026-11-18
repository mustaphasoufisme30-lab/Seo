import React, { useState } from 'react';
import { ArrowRight, Globe, Loader2, Lock, Sparkles } from 'lucide-react';
import type { AuditRequest, StorePlatform } from '../types/seo';

interface AuditFormProps {
  value: AuditRequest;
  onChange: (next: AuditRequest) => void;
  onSubmit: (req: AuditRequest) => void;
  isLoading: boolean;
  canRunFreeAudit: boolean;
  plan: 'free' | 'premium';
  onGoPricing: () => void;
}

const PLATFORMS: StorePlatform[] = ['Shopify', 'WooCommerce', 'PrestaShop', 'Autre'];

export const AuditForm: React.FC<AuditFormProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  canRunFreeAudit,
  plan,
  onGoPricing,
}) => {
  const [validationError, setValidationError] = useState<string>('');
  const isLocked = !canRunFreeAudit && plan === 'free';

  const updateField = <K extends keyof AuditRequest>(field: K, fieldValue: AuditRequest[K]) => {
    setValidationError('');
    onChange({ ...value, [field]: fieldValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setValidationError('Votre audit gratuit a déjà été utilisé. Passez en Premium pour lancer des audits illimités.');
      return;
    }
    if (!value.url.trim()) {
      setValidationError('Veuillez saisir l’URL de votre boutique (ex: https://maboutique.fr).');
      return;
    }
    if (!value.mainKeyword.trim()) {
      setValidationError('Veuillez indiquer votre mot-clé principal pour générer les opportunités transactionnelles.');
      return;
    }
    if (!value.niche.trim()) {
      setValidationError('Veuillez préciser la niche de votre boutique.');
      return;
    }
    setValidationError('');
    onSubmit(value);
  };

  const applyPreset = (preset: 'bio' | 'example') => {
    setValidationError('');
    if (preset === 'bio') {
      onChange({
        url: 'https://lamaison-savon.fr',
        platform: 'Shopify',
        mainKeyword: 'savon artisanal bio',
        niche: 'Cosmétiques naturels et soins solides',
        country: 'France',
        competitors: 'aroma-zone.com, comme-avant.bio',
      });
    } else {
      onChange({
        url: 'https://example.com',
        platform: 'WooCommerce',
        mainKeyword: 'chaussures running trail',
        niche: 'Équipement sportif outdoor',
        country: 'France',
        competitors: 'alltricks.fr, i-run.fr',
      });
    }
  };

  if (isLocked) {
    return (
      <section
        data-testid="audit-locked-gate"
        aria-label="Audit verrouillé"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Audit verrouillé — Passez au Premium
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Votre test gratuit offert a déjà été utilisé. Activez l’accès Premium pour débloquer de nouveaux audits illimités. Votre rapport déjà généré reste consultable et exportable ci-dessous.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoPricing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0"
          >
            Passer au Premium
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Paramètres de la boutique à auditer
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Crawl technique de la page d’accueil, analyse sémantique et 10 à 14 mots-clés transactionnels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => applyPreset('bio')}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            Exemple boutique bio
          </button>
          <button
            type="button"
            onClick={() => applyPreset('example')}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            Tester example.com
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="audit-url"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            URL de la boutique
          </label>
          <div className="relative mt-1.5">
            <Globe
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="audit-url"
              type="url"
              value={value.url}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://maboutique.fr"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="audit-platform"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Plateforme e-commerce
          </label>
          <select
            id="audit-platform"
            value={value.platform}
            onChange={(e) => updateField('platform', e.target.value as StorePlatform)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="audit-keyword"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Mot-clé principal
          </label>
          <input
            id="audit-keyword"
            type="text"
            value={value.mainKeyword}
            onChange={(e) => updateField('mainKeyword', e.target.value)}
            placeholder="ex: café en grain bio"
            className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>

        <div>
          <label
            htmlFor="audit-niche"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Niche / secteur
          </label>
          <input
            id="audit-niche"
            type="text"
            value={value.niche}
            onChange={(e) => updateField('niche', e.target.value)}
            placeholder="ex: Torréfaction artisanale et accessoires barista"
            className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>

        <div>
          <label
            htmlFor="audit-country"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Pays cible
          </label>
          <input
            id="audit-country"
            type="text"
            value={value.country}
            onChange={(e) => updateField('country', e.target.value)}
            placeholder="France"
            className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>

        <div>
          <label
            htmlFor="audit-competitors"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Concurrents (optionnel)
          </label>
          <input
            id="audit-competitors"
            type="text"
            value={value.competitors}
            onChange={(e) => updateField('competitors', e.target.value)}
            placeholder="ex: maxicoffee.com, terresdecafe.com"
            className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>
      </div>

      {validationError && (
        <div
          role="alert"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
        >
          <span>{validationError}</span>
          {!canRunFreeAudit && plan === 'free' && (
            <button
              type="button"
              onClick={onGoPricing}
              className="font-semibold underline hover:text-rose-900 dark:hover:text-rose-100"
            >
              Voir l’offre Premium
            </button>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {plan === 'premium' ? (
            <span>Offre Premium active · Audits illimités · Brouillon sauvegardé localement</span>
          ) : canRunFreeAudit ? (
            <span>1 audit gratuit inclus · Sauvegarde automatique dans votre navigateur</span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              Audit gratuit utilisé · Passez en Premium pour continuer
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Analyse en cours…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Lancer l’audit SEO
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
