import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  PenTool,
  Save,
} from 'lucide-react';
import type { ContentGenRequest, ContentType, GeneratedContent } from '../types/seo';
import {
  buildContentHtml,
  downloadHtmlFile,
  exportContentPdf,
} from '../utils/exportReport';

interface ContentGeneratorPageProps {
  request: ContentGenRequest;
  onRequestChange: (next: ContentGenRequest) => void;
  result: GeneratedContent | null;
  onResultChange: (next: GeneratedContent | null) => void;
}

const CONTENT_TABS: Array<{ id: ContentType; label: string; hint: string }> = [
  { id: 'product', label: 'Fiche produit', hint: 'Bénéfices, réassurance, FAQ produit et CTA' },
  { id: 'category', label: 'Description catégorie', hint: 'Texte SEO collection + maillage interne' },
  { id: 'blog', label: 'Article blog', hint: 'Guide d’achat complet et structure H2/H3' },
  { id: 'faq', label: 'FAQ', hint: 'Questions clients prêtes pour rich snippets' },
];

export const ContentGeneratorPage: React.FC<ContentGeneratorPageProps> = ({
  request,
  onRequestChange,
  result,
  onResultChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const updateField = <K extends keyof ContentGenRequest>(
    field: K,
    val: ContentGenRequest[K]
  ) => {
    setErrorMsg('');
    onRequestChange({ ...request, [field]: val });
  };

  const handleLoadExample = () => {
    setErrorMsg('');
    const presets: Record<ContentType, Partial<ContentGenRequest>> = {
      product: {
        topic: 'Savon surgras au lait d’ânesse bio 100g',
        mainKeyword: 'savon lait d anesse bio',
        secondaryKeywords: 'savon surgras peau sensible, savon artisanal saponifié à froid',
        niche: 'Cosmétiques naturels',
        keyBenefits: '25% de lait frais bio, fabrication artisanale française, zéro huile de palme',
      },
      category: {
        topic: 'Collection Savons Saponifiés à Froid',
        mainKeyword: 'savon saponifié à froid bio',
        secondaryKeywords: 'savon solide naturel, savon hydratant sans sulfate',
        niche: 'Cosmétiques solides zéro déchet',
        keyBenefits: 'Glycérine naturelle conservée, emballage recyclable, peaux réactives',
      },
      blog: {
        topic: 'Comment choisir un savon naturel pour peau sèche et atopique',
        mainKeyword: 'savon peau sèche naturel',
        secondaryKeywords: 'savon surgras avis, routine douche hydratante bio',
        niche: 'Soins dermatologiques naturels',
        keyBenefits: 'Comparatif pH, liste ingrédients à éviter, conseils d’utilisation quotidiens',
      },
      faq: {
        topic: 'Questions fréquentes sur les cosmétiques solides et la livraison',
        mainKeyword: 'cosmétique solide utilisation conservation',
        secondaryKeywords: 'durée de vie savon solide, livraison savonnerie',
        niche: 'Boutique cosmétiques zéro déchet',
        keyBenefits: 'Durée 2 mois, porte-savon drainant, expédition 24h en France',
      },
    };
    onRequestChange({ ...request, ...presets[request.type] });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.topic.trim() || !request.mainKeyword.trim()) {
      setErrorMsg('Veuillez renseigner le sujet et le mot-clé principal.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const data = await response.json();
      if (data?.content) {
        onResultChange(data.content);
      } else {
        setErrorMsg('Impossible de générer le contenu pour le moment.');
      }
    } catch {
      setErrorMsg('Erreur réseau lors de la génération. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPlainText = async () => {
    if (!result) return;
    const text = [
      `Meta Title: ${result.metaTitle ?? ''}`,
      `Meta Description: ${result.metaDescription ?? ''}`,
      `Slug: /${result.slug ?? ''}`,
      '',
      `# ${result.h1 ?? ''}`,
      '',
      result.intro ?? '',
      '',
      ...(result.sections ?? []).flatMap((s) => [`## ${s.heading}`, s.body, '']),
      ...(result.bulletPoints ?? []).map((b) => `- ${b}`),
      '',
      ...(result.faqItems ?? []).flatMap((f) => [`Q: ${f.question}`, `R: ${f.answer}`, '']),
      result.cta ?? '',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const updateResultField = <K extends keyof GeneratedContent>(
    field: K,
    val: GeneratedContent[K]
  ) => {
    if (!result) return;
    onResultChange({ ...result, [field]: val });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
          Générateur de contenu SEO e-commerce
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Rédigez des fiches produits, descriptions de collections, articles guides et FAQ prêts à publier. Vos brouillons sont enregistrés automatiquement localement avant export.
        </p>
      </div>

      {/* Format Segmented Control */}
      <div
        role="tablist"
        aria-label="Type de contenu SEO"
        className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1"
      >
        {CONTENT_TABS.map((tab) => {
          const active = request.type === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => updateField('type', tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Column */}
        <form
          onSubmit={handleGenerate}
          noValidate
          className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 self-start"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Brief éditorial
            </span>
            <button
              type="button"
              onClick={handleLoadExample}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              Remplir un exemple
            </button>
          </div>

          <div>
            <label htmlFor="cg-topic" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Produit, catégorie ou sujet
            </label>
            <input
              id="cg-topic"
              type="text"
              value={request.topic}
              onChange={(e) => updateField('topic', e.target.value)}
              placeholder="ex: Café en grain bio Colombie 500g"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          <div>
            <label htmlFor="cg-keyword" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Mot-clé principal
            </label>
            <input
              id="cg-keyword"
              type="text"
              value={request.mainKeyword}
              onChange={(e) => updateField('mainKeyword', e.target.value)}
              placeholder="ex: café en grain bio"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          <div>
            <label htmlFor="cg-secondary" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Mots-clés secondaires
            </label>
            <input
              id="cg-secondary"
              type="text"
              value={request.secondaryKeywords}
              onChange={(e) => updateField('secondaryKeywords', e.target.value)}
              placeholder="ex: arabica torréfaction artisanale, café commerce équitable"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cg-niche" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Niche
              </label>
              <input
                id="cg-niche"
                type="text"
                value={request.niche}
                onChange={(e) => updateField('niche', e.target.value)}
                placeholder="ex: Épicerie fine"
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
            <div>
              <label htmlFor="cg-tone" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Ton éditorial
              </label>
              <input
                id="cg-tone"
                type="text"
                value={request.tone}
                onChange={(e) => updateField('tone', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cg-benefits" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Arguments clés &amp; preuves
            </label>
            <textarea
              id="cg-benefits"
              rows={3}
              value={request.keyBenefits}
              onChange={(e) => updateField('keyBenefits', e.target.value)}
              placeholder="ex: Certifié AB, livraison 48h, torréfié à la commande"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          {errorMsg && (
            <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm text-rose-800 dark:text-rose-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Rédaction SEO en cours…
              </>
            ) : (
              <>
                <PenTool className="h-4 w-4" aria-hidden="true" />
                Générer le contenu SEO
              </>
            )}
          </button>
        </form>

        {/* Output / Editable Draft Column */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          {!result ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <PenTool className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Aucun contenu généré pour l’instant
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Choisissez un type de page, complétez le brief ou cliquez sur « Remplir un exemple », puis lancez la génération.
              </p>
            </div>
          ) : (
            <div className="space-y-5" data-testid="generated-content-output">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  Brouillon éditable sauvegardé localement
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPlainText}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadHtmlFile(`contenu-${result.slug || 'seo'}.html`, buildContentHtml(result))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    Exporter HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => exportContentPdf(result)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Exporter PDF
                  </button>
                </div>
              </div>

              {/* Editable SEO Metadata */}
              <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
                <div>
                  <label htmlFor="edit-metatitle" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Balise Meta Title ({(result.metaTitle ?? '').length} car.)
                  </label>
                  <input
                    id="edit-metatitle"
                    type="text"
                    value={result.metaTitle ?? ''}
                    onChange={(e) => updateResultField('metaTitle', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="edit-metadesc" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Meta Description ({(result.metaDescription ?? '').length} car.)
                  </label>
                  <textarea
                    id="edit-metadesc"
                    rows={2}
                    value={result.metaDescription ?? ''}
                    onChange={(e) => updateResultField('metaDescription', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  URL suggérée : /{result.slug ?? ''}
                </div>
              </div>

              {/* Editable H1 + Intro */}
              <div>
                <label htmlFor="edit-h1" className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Titre H1
                </label>
                <input
                  id="edit-h1"
                  type="text"
                  value={result.h1 ?? ''}
                  onChange={(e) => updateResultField('h1', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-lg font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label htmlFor="edit-intro" className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Introduction
                </label>
                <textarea
                  id="edit-intro"
                  rows={3}
                  value={result.intro ?? ''}
                  onChange={(e) => updateResultField('intro', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                />
              </div>

              {/* Sections */}
              <div className="space-y-4">
                {(result.sections ?? []).map((section, idx) => (
                  <div key={`sec-${idx}`} className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {section?.heading ?? ''}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {section?.body ?? ''}
                    </p>
                  </div>
                ))}
              </div>

              {(result.bulletPoints ?? []).length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Points forts commerciaux
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {(result.bulletPoints ?? []).map((b, idx) => (
                      <li key={`bp-${idx}`}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(result.faqItems ?? []).length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    FAQ intégrée
                  </h4>
                  <div className="mt-2 space-y-3">
                    {(result.faqItems ?? []).map((f, idx) => (
                      <div key={`faq-${idx}`}>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {f?.question ?? ''}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                          {f?.answer ?? ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.cta && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-sm font-semibold text-teal-700 dark:text-teal-400">
                  Appel à l’action suggéré : {result.cta}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
