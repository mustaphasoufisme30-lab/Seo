import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
} from 'lucide-react';
import type { GscAnalysisResponse, GscParsedSummary } from '../types/seo';
import {
  SAMPLE_GSC_CSV,
  parseGscCsv,
  parseManualGscInput,
} from '../utils/gscParser';
import {
  buildGscHtml,
  downloadHtmlFile,
  exportGscPdf,
} from '../utils/exportReport';

export interface GscManualDraft {
  clicks: string;
  impressions: string;
  ctr: string;
  avgPosition: string;
  queriesText: string;
  pagesText: string;
  notes: string;
  csvText?: string;
  csvFileName?: string;
}

interface GscAnalyzerPageProps {
  manualDraft: GscManualDraft;
  onManualDraftChange: (next: GscManualDraft) => void;
  result: GscAnalysisResponse | null;
  onResultChange: (next: GscAnalysisResponse | null) => void;
}

export const GscAnalyzerPage: React.FC<GscAnalyzerPageProps> = ({
  manualDraft,
  onManualDraftChange,
  result,
  onResultChange,
}) => {
  const [inputMode, setInputMode] = useState<'csv' | 'manual'>('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const csvText = manualDraft.csvText ?? '';
  const csvFileName = manualDraft.csvFileName ?? '';

  const localSummary: GscParsedSummary = useMemo(() => {
    if (inputMode === 'csv' && csvText.trim()) {
      return parseGscCsv(csvText);
    }
    return parseManualGscInput(manualDraft);
  }, [inputMode, csvText, manualDraft]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    const text = await file.text();
    onManualDraftChange({
      ...manualDraft,
      csvFileName: file.name,
      csvText: text,
    });
    setInputMode('csv');
  };

  const handleLoadSample = () => {
    setErrorMsg('');
    if (inputMode === 'csv') {
      onManualDraftChange({
        ...manualDraft,
        csvText: SAMPLE_GSC_CSV,
        csvFileName: 'exemple-search-console.csv',
      });
    } else {
      onManualDraftChange({
        ...manualDraft,
        clicks: '1810',
        impressions: '78200',
        ctr: '2.31',
        avgPosition: '7.5',
        queriesText: [
          'savon artisanal bio; 412; 14200; 2.9%; 5.4',
          'savon saponifié à froid; 285; 18900; 1.51%; 6.8',
          'coffret savon naturel cadeau; 164; 9800; 1.67%; 7.2',
          'shampoing solide sans sulfate; 118; 11200; 1.05%; 11.2',
        ].join('\n'),
        pagesText: [
          '/collections/savons-bio; 890; 34000; 2.61%; 6.1',
          '/products/savon-lait-chevre; 410; 16500; 2.48%; 5.2',
        ].join('\n'),
        notes: 'Boutique Shopify orientée cosmétiques bio, objectif augmenter le CTR sur les collections.',
      });
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasCsvData = inputMode === 'csv' && (localSummary.topQueries.length > 0 || localSummary.topPages.length > 0);
    const hasManualData =
      inputMode === 'manual' &&
      (localSummary.totals.clicks > 0 ||
        localSummary.totals.impressions > 0 ||
        localSummary.topQueries.length > 0 ||
        localSummary.topPages.length > 0);

    if (!hasCsvData && !hasManualData) {
      setErrorMsg(
        inputMode === 'csv'
          ? 'Importez un fichier CSV Search Console ou chargez l’exemple pour analyser.'
          : 'Saisissez vos totaux ou vos top requêtes/pages avant de lancer l’analyse.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/gsc-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: localSummary,
          notes: manualDraft.notes,
        }),
      });
      const data = await response.json();
      if (data?.recommendations) {
        onResultChange(data);
      } else {
        setErrorMsg('Réponse incomplète lors de l’analyse GSC.');
      }
    } catch {
      setErrorMsg('Erreur réseau lors de l’analyse Search Console.');
    } finally {
      setIsLoading(false);
    }
  };

  const displaySummary = result?.summary ?? localSummary;
  const recommendations = result?.recommendations ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
          Analyse Google Search Console (CSV ou saisie directe)
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Aucune connexion OAuth ni clé API Google requise : importez directement votre export CSV Search Console ou collez vos totaux, top requêtes et top pages pour obtenir 6 à 8 recommandations prioritaires.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Méthode d’import Search Console"
          className="inline-flex gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'csv'}
            onClick={() => setInputMode('csv')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              inputMode === 'csv'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Importer un CSV GSC
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'manual'}
            onClick={() => setInputMode('manual')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              inputMode === 'manual'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Coller manuellement
          </button>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          Charger un exemple GSC
        </button>
      </div>

      <form
        onSubmit={handleAnalyze}
        noValidate
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
      >
        {inputMode === 'csv' ? (
          <div className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {csvFileName || 'Sélectionner un export CSV Google Search Console'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Compatible Requêtes.csv et Pages.csv (séparateurs virgule ou point-virgule).
                  </div>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Choisir un fichier CSV
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            <div>
              <label htmlFor="gsc-csv-raw" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Ou coller directement le contenu CSV
              </label>
              <textarea
                id="gsc-csv-raw"
                rows={6}
                value={csvText}
                onChange={(e) => onManualDraftChange({ ...manualDraft, csvText: e.target.value })}
                placeholder={'Requêtes les plus fréquentes;Clics;Impressions;CTR;Position\nsavon bio;412;14200;2,9%;5,4'}
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 font-mono text-xs text-slate-900 dark:text-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label htmlFor="gsc-clicks" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Clics totaux
                </label>
                <input
                  id="gsc-clicks"
                  type="text"
                  value={manualDraft.clicks}
                  onChange={(e) => onManualDraftChange({ ...manualDraft, clicks: e.target.value })}
                  placeholder="ex: 1810"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="gsc-imp" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Impressions totales
                </label>
                <input
                  id="gsc-imp"
                  type="text"
                  value={manualDraft.impressions}
                  onChange={(e) => onManualDraftChange({ ...manualDraft, impressions: e.target.value })}
                  placeholder="ex: 78200"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="gsc-ctr" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  CTR moyen (%)
                </label>
                <input
                  id="gsc-ctr"
                  type="text"
                  value={manualDraft.ctr}
                  onChange={(e) => onManualDraftChange({ ...manualDraft, ctr: e.target.value })}
                  placeholder="ex: 2.31"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="gsc-pos" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Position moyenne
                </label>
                <input
                  id="gsc-pos"
                  type="text"
                  value={manualDraft.avgPosition}
                  onChange={(e) => onManualDraftChange({ ...manualDraft, avgPosition: e.target.value })}
                  placeholder="ex: 7.5"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="gsc-queries" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Top requêtes (format : requête ; clics ; impressions ; ctr ; position)
                </label>
                <textarea
                  id="gsc-queries"
                  rows={5}
                  value={manualDraft.queriesText}
                  onChange={(e) => onManualDraftChange({ ...manualDraft, queriesText: e.target.value })}
                  placeholder={'savon bio; 412; 14200; 2.9%; 5.4\ncoffret savon; 164; 9800; 1.67%; 7.2'}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 font-mono text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="gsc-pages" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Top pages (format : url ; clics ; impressions ; ctr ; position)
                </label>
                <textarea
                  id="gsc-pages"
                  rows={5}
                  value={manualDraft.pagesText}
                  onChange={(e) => onManualDraftChange({ ...manualDraft, pagesText: e.target.value })}
                  placeholder={'/collections/savons-bio; 890; 34000; 2.61%; 6.1'}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 font-mono text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="gsc-notes" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Contexte boutique (optionnel)
          </label>
          <input
            id="gsc-notes"
            type="text"
            value={manualDraft.notes}
            onChange={(e) => onManualDraftChange({ ...manualDraft, notes: e.target.value })}
            placeholder="ex: Boutique Shopify, priorité sur le développement des collections saisonnières"
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        {errorMsg && (
          <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-sm text-rose-800 dark:text-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Aperçu local : {localSummary.totals.clicks} clics · {localSummary.totals.impressions} impressions · {localSummary.opportunities.length} opportunités détectées
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Analyse en cours…
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Analyser les données GSC
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results View */}
      {recommendations.length > 0 && (
        <div className="space-y-6" data-testid="gsc-results">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {recommendations.length} recommandations Search Console prioritaires
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                  {result?.executiveNote ?? ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadHtmlFile('recommandations-gsc.html', buildGscHtml(result))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Exporter HTML
                </button>
                <button
                  type="button"
                  onClick={() => exportGscPdf(result)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Exporter PDF
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4 sm:grid-cols-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Clics</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {displaySummary?.totals?.clicks ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Impressions</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {displaySummary?.totals?.impressions ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">CTR moyen</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-teal-700 dark:text-teal-400">
                  {displaySummary?.totals?.ctr ?? 0}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Position moyenne</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {displaySummary?.totals?.avgPosition ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recommendations.map((rec, idx) => (
              <article
                key={`gsc-rec-${idx}`}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{rec?.category ?? 'SEO'}</span>
                  <span
                    className={`font-semibold ${
                      rec?.priority === 'Haute'
                        ? 'text-rose-700 dark:text-rose-400'
                        : rec?.priority === 'Moyenne'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-teal-700 dark:text-teal-400'
                    }`}
                  >
                    Priorité {rec?.priority ?? 'Moyenne'}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-slate-100">
                  {idx + 1}. {rec?.title ?? ''}
                </h3>
                <div className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                  Cible : {rec?.target ?? ''}
                </div>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300">
                  {rec?.diagnosis ?? ''}
                </p>
                <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
                  <span className="font-semibold text-teal-700 dark:text-teal-400">Action : </span>
                  {rec?.action ?? ''}
                </p>
                <div className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Impact attendu : {rec?.expectedImpact ?? ''}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
