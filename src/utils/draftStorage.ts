import type {
  AuditApiResponse,
  AuditRequest,
  ContentGenRequest,
  GeneratedContent,
  GscAnalysisResponse,
} from '../types/seo';

const STORAGE_KEY = 'seo_boutique_ia_drafts_v1';
const THEME_KEY = 'seo_boutique_ia_theme_v1';
const USAGE_KEY = 'seo_boutique_ia_usage_v1';

export interface StoredDrafts {
  auditRequest: AuditRequest;
  auditResult: AuditApiResponse | null;
  contentRequest: ContentGenRequest;
  contentResult: GeneratedContent | null;
  gscManual: {
    clicks: string;
    impressions: string;
    ctr: string;
    avgPosition: string;
    queriesText: string;
    pagesText: string;
    notes: string;
    csvText?: string;
    csvFileName?: string;
  };
  gscResult: GscAnalysisResponse | null;
  updatedAt: string;
}

export interface UsageState {
  freeAuditsUsed: number;
  plan: 'free' | 'premium';
  licenseKey?: string;
}

export const DEFAULT_AUDIT_REQUEST: AuditRequest = {
  url: '',
  platform: 'Shopify',
  mainKeyword: '',
  niche: '',
  country: 'France',
  competitors: '',
};

export const DEFAULT_CONTENT_REQUEST: ContentGenRequest = {
  type: 'product',
  topic: '',
  mainKeyword: '',
  secondaryKeywords: '',
  niche: '',
  tone: 'Expert, rassurant et orienté conversion',
  audience: 'Acheteurs e-commerce exigeants',
  keyBenefits: '',
};

export const DEFAULT_DRAFTS: StoredDrafts = {
  auditRequest: DEFAULT_AUDIT_REQUEST,
  auditResult: null,
  contentRequest: DEFAULT_CONTENT_REQUEST,
  contentResult: null,
  gscManual: {
    clicks: '',
    impressions: '',
    ctr: '',
    avgPosition: '',
    queriesText: '',
    pagesText: '',
    notes: '',
    csvText: '',
    csvFileName: '',
  },
  gscResult: null,
  updatedAt: '',
};

export function loadDrafts(): StoredDrafts {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DRAFTS,
      ...parsed,
      auditRequest: { ...DEFAULT_AUDIT_REQUEST, ...(parsed.auditRequest || {}) },
      contentRequest: { ...DEFAULT_CONTENT_REQUEST, ...(parsed.contentRequest || {}) },
      gscManual: { ...DEFAULT_DRAFTS.gscManual, ...(parsed.gscManual || {}) },
    };
  } catch {
    return DEFAULT_DRAFTS;
  }
}

export function saveDrafts(partial: Partial<StoredDrafts>): StoredDrafts {
  const current = loadDrafts();
  const next: StoredDrafts = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function loadThemePreference(): boolean {
  try {
    // Light mode is ALWAYS default; dark mode only activates if explicitly saved as 'dark'
    return window.localStorage.getItem(THEME_KEY) === 'dark';
  } catch {
    return false;
  }
}

export function saveThemePreference(isDark: boolean): void {
  try {
    window.localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  } catch {
    // Ignore
  }
}

export function loadUsageState(): UsageState {
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    if (!raw) return { freeAuditsUsed: 0, plan: 'free' };
    const parsed = JSON.parse(raw);
    return {
      freeAuditsUsed: Number(parsed.freeAuditsUsed) || 0,
      plan: parsed.plan === 'premium' ? 'premium' : 'free',
      licenseKey: typeof parsed.licenseKey === 'string' ? parsed.licenseKey : undefined,
    };
  } catch {
    return { freeAuditsUsed: 0, plan: 'free' };
  }
}

export function saveUsageState(state: UsageState): void {
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
}
