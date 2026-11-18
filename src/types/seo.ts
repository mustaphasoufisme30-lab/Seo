export type StorePlatform = 'Shopify' | 'WooCommerce' | 'PrestaShop' | 'Autre';

export interface AuditRequest {
  url: string;
  platform: StorePlatform;
  mainKeyword: string;
  niche: string;
  country: string;
  competitors: string;
}

export interface HomepageCrawl {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  wordCount?: number;
  hasSchema?: boolean;
  canonical?: string;
}

export interface CrawlData {
  domain: string;
  homepage: HomepageCrawl;
  categories: string[];
  products: string[];
  crawlSuccess?: boolean;
  crawlNote?: string;
}

export interface PageSpeedData {
  mobileScore: number;
  desktopScore: number;
}

export interface TransactionalKeyword {
  keyword: string;
  intent: string;
  estimatedVolume: string;
  difficulty: 'Faible' | 'Moyenne' | 'Élevée';
  targetPage: string;
  recommendation: string;
}

export interface AuditIssue {
  title: string;
  severity: 'Critique' | 'Important' | 'Optimisation';
  impact: string;
  fix: string;
}

export interface ActionItem {
  task: string;
  priority: 'Haute' | 'Moyenne' | 'Normale';
  effort: string;
  expectedGain: string;
}

export interface AuditReport {
  globalScore: number;
  isPartial: boolean;
  statusMessage: string;
  executiveSummary: string;
  scores: {
    technical: number;
    onPage: number;
    semantic: number;
    conversionSeo: number;
  };
  technicalIssues: AuditIssue[];
  onPageFindings: AuditIssue[];
  transactionalKeywords: TransactionalKeyword[];
  competitorInsights: string[];
  platformTips: string[];
  actionPlan: {
    urgent: ActionItem[];
    mediumTerm: ActionItem[];
    longTerm: ActionItem[];
  };
}

export interface AuditApiResponse {
  request: AuditRequest;
  crawl: CrawlData;
  pageSpeed: PageSpeedData;
  report: AuditReport;
}

export type ContentType = 'product' | 'category' | 'blog' | 'faq';

export interface ContentGenRequest {
  type: ContentType;
  topic: string;
  mainKeyword: string;
  secondaryKeywords: string;
  niche: string;
  tone: string;
  audience: string;
  keyBenefits: string;
}

export interface GeneratedContent {
  type: ContentType;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  slug: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  bulletPoints: string[];
  faqItems: Array<{
    question: string;
    answer: string;
  }>;
  cta: string;
  seoChecklist: string[];
}

export interface GscRow {
  label: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscParsedSummary {
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
  };
  topQueries: GscRow[];
  topPages: GscRow[];
  opportunities: Array<{
    queryOrPage: string;
    reason: string;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  sourceMode: 'csv' | 'manual';
}

export interface GscRecommendation {
  title: string;
  category: 'CTR & Balises' | 'Contenu & Position' | 'Maillage interne' | 'Technique & Indexation';
  priority: 'Haute' | 'Moyenne' | 'Opportunité';
  target: string;
  diagnosis: string;
  action: string;
  expectedImpact: string;
}

export interface GscAnalysisResponse {
  summary: GscParsedSummary;
  recommendations: GscRecommendation[];
  executiveNote: string;
}
