import React, { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import type {
  AuditApiResponse,
  AuditRequest,
  ContentGenRequest,
  GeneratedContent,
  GscAnalysisResponse,
} from './types/seo';
import {
  DEFAULT_AUDIT_REQUEST,
  DEFAULT_CONTENT_REQUEST,
  DEFAULT_DRAFTS,
  loadDrafts,
  loadThemePreference,
  loadUsageState,
  saveDrafts,
  saveThemePreference,
  saveUsageState,
  type UsageState,
} from './utils/draftStorage';
import { AuditForm } from './components/AuditForm';
import { AuditReportView } from './components/AuditReportView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ContentGeneratorPage } from './components/ContentGeneratorPage';
import { GscAnalyzerPage, type GscManualDraft } from './components/GscAnalyzerPage';
import { PricingPage } from './components/PricingPage';
import { HomeFaqSection } from './components/HomeFaqSection';

type ActivePage = 'audit' | 'content' | 'gsc' | 'pricing';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('audit');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark mode is ALWAYS false by default
  const [isDark, setIsDark] = useState<boolean>(() => loadThemePreference());

  // Persistent LocalStorage state
  const [auditRequest, setAuditRequest] = useState<AuditRequest>(DEFAULT_AUDIT_REQUEST);
  const [auditResult, setAuditResult] = useState<AuditApiResponse | null>(null);
  const [contentRequest, setContentRequest] = useState<ContentGenRequest>(DEFAULT_CONTENT_REQUEST);
  const [contentResult, setContentResult] = useState<GeneratedContent | null>(null);
  const [gscManual, setGscManual] = useState<GscManualDraft>(DEFAULT_DRAFTS.gscManual);
  const [gscResult, setGscResult] = useState<GscAnalysisResponse | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [usage, setUsage] = useState<UsageState>(() => loadUsageState());

  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  // Restore saved drafts from LocalStorage on mount
  useEffect(() => {
    const saved = loadDrafts();
    setAuditRequest(saved.auditRequest);
    setAuditResult(saved.auditResult);
    setContentRequest(saved.contentRequest);
    setContentResult(saved.contentResult);
    setGscManual(saved.gscManual);
    setGscResult(saved.gscResult);
    setLastSavedAt(saved.updatedAt);
  }, []);

  // Sync dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    saveThemePreference(isDark);
  }, [isDark]);

  // Auto-save drafts whenever state changes
  const persistAuditRequest = (next: AuditRequest) => {
    setAuditRequest(next);
    const stored = saveDrafts({ auditRequest: next });
    setLastSavedAt(stored.updatedAt);
  };

  const persistAuditResult = (next: AuditApiResponse | null) => {
    setAuditResult(next);
    const stored = saveDrafts({ auditResult: next });
    setLastSavedAt(stored.updatedAt);
  };

  const persistContentRequest = (next: ContentGenRequest) => {
    setContentRequest(next);
    const stored = saveDrafts({ contentRequest: next });
    setLastSavedAt(stored.updatedAt);
  };

  const persistContentResult = (next: GeneratedContent | null) => {
    setContentResult(next);
    const stored = saveDrafts({ contentResult: next });
    setLastSavedAt(stored.updatedAt);
  };

  const persistGscManual = (next: GscManualDraft) => {
    setGscManual(next);
    const stored = saveDrafts({ gscManual: next });
    setLastSavedAt(stored.updatedAt);
  };

  const persistGscResult = (next: GscAnalysisResponse | null) => {
    setGscResult(next);
    const stored = saveDrafts({ gscResult: next });
    setLastSavedAt(stored.updatedAt);
  };

  const handleRunAudit = async (req: AuditRequest) => {
    setIsAuditLoading(true);
    setAuditError('');
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      const payload = (await response.json()) as Partial<AuditApiResponse>;

      // Enforce client-side fallback protection matching { request, crawl, pageSpeed, report }
      const safeData: AuditApiResponse = {
        request: payload?.request ?? req,
        crawl: payload?.crawl ?? {
          domain: req.url,
          homepage: { url: req.url, title: '', metaDescription: '', h1: '' },
          categories: [],
          products: [],
        },
        pageSpeed: payload?.pageSpeed ?? { mobileScore: 0, desktopScore: 0 },
        report: payload?.report as AuditApiResponse['report'],
      };

      persistAuditResult(safeData);

      setTimeout(() => {
        const el = document.querySelector('[data-testid="audit-report-view"]');
        if (el) {
          const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }
      }, 60);

      if (usage.plan === 'free') {
        const nextUsage: UsageState = {
          ...usage,
          freeAuditsUsed: usage.freeAuditsUsed + 1,
        };
        setUsage(nextUsage);
        saveUsageState(nextUsage);
      }
    } catch {
      setAuditError('Impossible de joindre le serveur d’audit. Veuillez réessayer.');
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleActivatePremium = () => {
    const next: UsageState = { ...usage, plan: 'premium' };
    setUsage(next);
    saveUsageState(next);
  };

  const handleResetQuota = () => {
    const next: UsageState = { freeAuditsUsed: 0, plan: 'free' };
    setUsage(next);
    saveUsageState(next);
  };

  const navigateTo = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const navItems: Array<{ id: ActivePage; label: string }> = [
    { id: 'audit', label: 'Audit SEO' },
    { id: 'content', label: 'Générateur' },
    { id: 'gsc', label: 'Search Console' },
    { id: 'pricing', label: 'Tarifs' },
  ];

  const canRunFreeAudit = usage.plan === 'premium' || usage.freeAuditsUsed < 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: 3 zones, single row */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single-line Brand wordmark */}
          <a
            href="#audit"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('audit');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            SEO Boutique IA
          </a>

          {/* Zone 2: Concise single-line nav links */}
          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-1 whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'border-teal-700 text-slate-900 dark:text-slate-100 dark:border-teal-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action + mobile menu button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                navigateTo('audit');
                const input = document.getElementById('audit-url');
                input?.focus();
              }}
              className="hidden sm:inline-flex items-center rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              Nouvel audit
            </button>
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <nav
            aria-label="Navigation mobile"
            className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={`mob-${item.id}`}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Workspace utility strip (Theme toggle & local draft notice) */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 sm:px-6">
          <div className="truncate">
            {lastSavedAt
              ? `Brouillons sauvegardés automatiquement (${new Date(lastSavedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`
              : 'Sauvegarde locale automatique activée'}
          </div>
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                Mode clair
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                Mode sombre
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {activePage === 'audit' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl max-w-2xl [text-wrap:balance]">
                Audit SEO E-Commerce pour boutiques rentables
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-400">
                Diagnostiquez votre boutique Shopify, WooCommerce ou PrestaShop, identifiez 10 à 14 mots-clés transactionnels et exportez votre plan d’action en PDF ou HTML.
              </p>
            </div>

            <AuditForm
              value={auditRequest}
              onChange={persistAuditRequest}
              onSubmit={handleRunAudit}
              isLoading={isAuditLoading}
              canRunFreeAudit={canRunFreeAudit}
              plan={usage.plan}
              onGoPricing={() => navigateTo('pricing')}
            />

            {auditError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 p-6 text-sm text-rose-800 dark:text-rose-200"
              >
                {auditError}
              </div>
            )}

            {isAuditLoading ? (
              <div
                aria-busy="true"
                aria-label="Génération de l'audit SEO en cours"
                className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
              >
                <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ) : auditResult ? (
              <ErrorBoundary onReset={() => persistAuditResult(null)}>
                <AuditReportView
                  data={auditResult}
                  onRetry={() => handleRunAudit(auditRequest)}
                  lastSavedAt={lastSavedAt}
                />
              </ErrorBoundary>
            ) : (
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Ce que contient chaque audit SEO Boutique IA
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      01. Crawl &amp; Vitesse
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Extraction automatique des balises Title, Meta Description, H1, catégories, produits et scores PageSpeed.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      02. 10–14 Mots-clés d’achat
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Requêtes transactionnelles ciblées selon votre niche et votre pays, même si votre boutique est en lancement.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      03. Plan d’action &amp; Exports
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Priorités urgentes, moyen terme et exports PDF/HTML prêts à partager avec votre équipe.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <HomeFaqSection />
          </div>
        )}

        {activePage === 'content' && (
          <ContentGeneratorPage
            request={contentRequest}
            onRequestChange={persistContentRequest}
            result={contentResult}
            onResultChange={persistContentResult}
          />
        )}

        {activePage === 'gsc' && (
          <GscAnalyzerPage
            manualDraft={gscManual}
            onManualDraftChange={persistGscManual}
            result={gscResult}
            onResultChange={persistGscResult}
          />
        )}

        {activePage === 'pricing' && (
          <PricingPage
            usage={usage}
            onActivatePremium={handleActivatePremium}
            onResetQuota={handleResetQuota}
            onGoAudit={() => navigateTo('audit')}
          />
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:px-6">
          <span>SEO Boutique IA · Suite d’audit et de rédaction SEO pour e-commerçants</span>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => navigateTo('audit')} className="hover:text-slate-900 dark:hover:text-slate-100">
              Audit SEO
            </button>
            <button type="button" onClick={() => navigateTo('content')} className="hover:text-slate-900 dark:hover:text-slate-100">
              Générateur
            </button>
            <button type="button" onClick={() => navigateTo('gsc')} className="hover:text-slate-900 dark:hover:text-slate-100">
              Search Console
            </button>
            <button type="button" onClick={() => navigateTo('pricing')} className="hover:text-slate-900 dark:hover:text-slate-100">
              Tarifs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
