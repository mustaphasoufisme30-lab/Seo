import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  RotateCcw,
  Save,
} from 'lucide-react';
import type { AuditApiResponse } from '../types/seo';
import {
  buildAuditHtml,
  downloadHtmlFile,
  exportAuditPdf,
} from '../utils/exportReport';

interface AuditReportViewProps {
  data: Partial<AuditApiResponse> | null | undefined;
  onRetry?: () => void;
  lastSavedAt?: string;
}

interface SectionToggleProps {
  id: string;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<SectionToggleProps> = ({
  id,
  title,
  subtitle,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
      >
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-500 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          id={id}
          className="border-t border-slate-200 dark:border-slate-800 px-6 py-5"
        >
          {children}
        </div>
      )}
    </section>
  );
};

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  data,
  onRetry,
  lastSavedAt,
}) => {
  const report = data?.report;

  // ANTI-BUG RULE #2: Never return null or crash if report is missing
  if (!report) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Audit incomplet, réessayez
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Les données du rapport ne sont pas disponibles. Relancez l’analyse pour obtenir le diagnostic complet.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Relancer l’audit
          </button>
        )}
      </div>
    );
  }

  const request = data?.request;
  const crawl = data?.crawl;
  const pageSpeed = data?.pageSpeed;

  const domain = crawl?.domain ?? request?.url ?? 'Boutique';
  const transactionalKeywords = report?.transactionalKeywords ?? [];
  const technicalIssues = report?.technicalIssues ?? [];
  const onPageFindings = report?.onPageFindings ?? [];
  const competitorInsights = report?.competitorInsights ?? [];
  const platformTips = report?.platformTips ?? [];
  const urgentActions = report?.actionPlan?.urgent ?? [];
  const mediumActions = report?.actionPlan?.mediumTerm ?? [];
  const longActions = report?.actionPlan?.longTerm ?? [];
  const categories = crawl?.categories ?? [];
  const products = crawl?.products ?? [];

  const handleExportHtml = () => {
    const html = buildAuditHtml(data);
    const slug = String(domain).replace(/[^a-z0-9.-]/gi, '-');
    downloadHtmlFile(`audit-seo-${slug}.html`, html);
  };

  const handleExportPdf = () => {
    exportAuditPdf(data);
  };

  const scoreTone = (score: number) => {
    if (score >= 75) return 'text-emerald-700 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const severityLabelClass = (severity: string) => {
    if (severity === 'Critique') return 'text-rose-700 dark:text-rose-400 font-semibold';
    if (severity === 'Important') return 'text-amber-700 dark:text-amber-400 font-semibold';
    return 'text-teal-700 dark:text-teal-400 font-semibold';
  };

  return (
    <div className="space-y-6 scroll-mt-20" data-testid="audit-report-view">
      {/* Header summary bar + export actions */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{request?.platform ?? 'E-commerce'}</span>
              <span aria-hidden="true">·</span>
              <span>{request?.country ?? 'France'}</span>
              <span aria-hidden="true">·</span>
              <span>Mot-clé : {request?.mainKeyword ?? '-'}</span>
              {lastSavedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400">
                    <Save className="h-3 w-3" aria-hidden="true" />
                    Brouillon sauvegardé
                  </span>
                </>
              )}
            </div>
            <h2 className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
              Rapport SEO — {domain}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {report?.executiveSummary ?? ''}
            </p>
            {report?.statusMessage && (
              <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                Statut d’analyse :{' '}
                <span className={report?.isPartial ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
                  {report.statusMessage}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportHtml}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Exporter HTML
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Exporter PDF
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-5 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Score global</div>
            <div className={`mt-1 text-2xl font-bold tabular-nums ${scoreTone(report?.globalScore ?? 0)}`}>
              {report?.globalScore ?? 0}/100
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Technique</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {report?.scores?.technical ?? 0}/100
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">On-Page</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {report?.scores?.onPage ?? 0}/100
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Sémantique</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {report?.scores?.semantic ?? 0}/100
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">PageSpeed Mobile</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {pageSpeed?.mobileScore ?? 0}/100
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">PageSpeed Desktop</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {pageSpeed?.desktopScore ?? 0}/100
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Mots-clés transactionnels (10-14) */}
      <CollapsibleSection
        id="section-keywords"
        title={`Mots-clés transactionnels (${transactionalKeywords.length})`}
        subtitle="Requêtes à forte intention d’achat adaptées à votre niche et à vos pages catégories/produits"
        defaultOpen={true}
      >
        {transactionalKeywords.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun mot-clé transactionnel généré.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="pb-2.5 pr-4">Mot-clé</th>
                  <th className="pb-2.5 pr-4">Intention</th>
                  <th className="pb-2.5 pr-4">Volume estimé</th>
                  <th className="pb-2.5 pr-4">Difficulté</th>
                  <th className="pb-2.5 pr-4">Page cible</th>
                  <th className="pb-2.5">Recommandation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactionalKeywords.map((kw, idx) => (
                  <tr key={`${kw?.keyword ?? 'kw'}-${idx}`} className="align-top">
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                      {kw?.keyword ?? ''}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                      {kw?.intent ?? ''}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {kw?.estimatedVolume ?? '-'}
                    </td>
                    <td className="py-3 pr-4 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {kw?.difficulty ?? 'Moyenne'}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {kw?.targetPage ?? ''}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {kw?.recommendation ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* Section 2: Crawl & Technique */}
      <CollapsibleSection
        id="section-technical"
        title="Audit Technique & Données de Crawl"
        subtitle="Balises détectées sur la page d’accueil, structure catalogue et anomalies prioritaires"
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 md:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Title détecté</div>
            <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
              {crawl?.homepage?.title || 'Non détecté (balise vide ou site protégé)'}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Meta Description</div>
            <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
              {crawl?.homepage?.metaDescription || 'Non détectée'}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Balise H1</div>
            <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
              {crawl?.homepage?.h1 || 'Non détectée'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-600 dark:text-slate-400">
          <span>
            Catégories détectées : <strong className="tabular-nums text-slate-900 dark:text-slate-100">{categories.length}</strong>
          </span>
          <span>
            Produits détectés : <strong className="tabular-nums text-slate-900 dark:text-slate-100">{products.length}</strong>
          </span>
          {crawl?.crawlNote && <span>Note crawl : {crawl.crawlNote}</span>}
        </div>

        <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
          {technicalIssues.map((issue, idx) => (
            <div key={`tech-${idx}`} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {issue?.title ?? ''}
                </h4>
                <span className={`text-xs ${severityLabelClass(issue?.severity ?? '')}`}>
                  {issue?.severity ?? 'Important'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{issue?.impact ?? ''}</p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                <span className="font-medium text-teal-700 dark:text-teal-400">Correctif : </span>
                {issue?.fix ?? ''}
              </p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 3: On-Page, Concurrence & Spécificités Plateforme */}
      <CollapsibleSection
        id="section-onpage"
        title={`On-Page, Concurrence & Conseils ${request?.platform ?? 'E-Commerce'}`}
        subtitle="Optimisations sémantiques, positionnement concurrentiel et réglages CMS"
        defaultOpen={false}
      >
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {onPageFindings.map((finding, idx) => (
            <div key={`onpage-${idx}`} className="py-3.5 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {finding?.title ?? ''}
                </h4>
                <span className={`text-xs ${severityLabelClass(finding?.severity ?? '')}`}>
                  {finding?.severity ?? 'Important'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{finding?.impact ?? ''}</p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                <span className="font-medium text-teal-700 dark:text-teal-400">Action : </span>
                {finding?.fix ?? ''}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-200 dark:border-slate-800 pt-5 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Analyse concurrentielle
            </h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-4">
              {competitorInsights.map((tip, i) => (
                <li key={`comp-${i}`}>{tip}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Bonnes pratiques {request?.platform ?? 'CMS'}
            </h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-4">
              {platformTips.map((tip, i) => (
                <li key={`plat-${i}`}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4: Plan d'action priorisé */}
      <CollapsibleSection
        id="section-action-plan"
        title="Plan d’action priorisé"
        subtitle="Feuille de route classée par urgence et retour sur investissement SEO"
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">
              Urgent (Semaine 1-2)
            </h4>
            <ul className="mt-3 space-y-3">
              {urgentActions.map((item, idx) => (
                <li
                  key={`urg-${idx}`}
                  className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-b-0"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item?.task ?? ''}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Effort : {item?.effort ?? '-'} · Gain : {item?.expectedGain ?? '-'}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Moyen terme (Mois 1-2)
            </h4>
            <ul className="mt-3 space-y-3">
              {mediumActions.map((item, idx) => (
                <li
                  key={`med-${idx}`}
                  className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-b-0"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item?.task ?? ''}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Effort : {item?.effort ?? '-'} · Gain : {item?.expectedGain ?? '-'}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-teal-700 dark:text-teal-400">
              Long terme (Trimestre)
            </h4>
            <ul className="mt-3 space-y-3">
              {longActions.map((item, idx) => (
                <li
                  key={`long-${idx}`}
                  className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-b-0"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item?.task ?? ''}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Effort : {item?.effort ?? '-'} · Gain : {item?.expectedGain ?? '-'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};
