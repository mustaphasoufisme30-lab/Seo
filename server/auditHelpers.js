/**
 * Pure helper and normalization functions for e-commerce SEO audits.
 * Guarantees strict API contract { request, crawl, pageSpeed, report }
 * and prevents missing fields or empty keyword arrays.
 */

export function normalizeUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return 'https://example.com';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function extractDomain(rawUrl) {
  try {
    const parsed = new URL(normalizeUrl(rawUrl));
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return String(rawUrl || 'example.com')
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0] || 'example.com';
  }
}

export function buildDefaultCrawl(rawUrl) {
  const url = normalizeUrl(rawUrl);
  const domain = extractDomain(url);
  return {
    domain,
    homepage: {
      url,
      title: '',
      metaDescription: '',
      h1: '',
      wordCount: 0,
      hasSchema: false,
      canonical: '',
    },
    categories: [],
    products: [],
    crawlSuccess: false,
    crawlNote: '',
  };
}

export function buildDefaultPageSpeed() {
  return {
    mobileScore: 0,
    desktopScore: 0,
  };
}

export function normalizeAuditRequest(input = {}) {
  const validPlatforms = ['Shopify', 'WooCommerce', 'PrestaShop', 'Autre'];
  const platform = validPlatforms.includes(input.platform) ? input.platform : 'Shopify';
  return {
    url: normalizeUrl(input.url),
    platform,
    mainKeyword: String(input.mainKeyword || '').trim() || 'boutique en ligne',
    niche: String(input.niche || '').trim() || 'e-commerce spécialisé',
    country: String(input.country || '').trim() || 'France',
    competitors: String(input.competitors || '').trim(),
  };
}

export function ensureTransactionalKeywords(keywords, request) {
  const baseKeyword = String(request?.mainKeyword || '').trim() || 'produit phare';
  const niche = String(request?.niche || '').trim() || 'boutique spécialisée';
  const country = String(request?.country || '').trim() || 'France';

  const cleaned = Array.isArray(keywords)
    ? keywords
        .filter((item) => item && typeof item.keyword === 'string' && item.keyword.trim().length > 0)
        .map((item) => ({
          keyword: String(item.keyword || '').trim(),
          intent: String(item.intent || 'Achat / Transactionnel').trim(),
          estimatedVolume: String(item.estimatedVolume || '300 - 1 200 / mois').trim(),
          difficulty: ['Faible', 'Moyenne', 'Élevée'].includes(item.difficulty)
            ? item.difficulty
            : 'Moyenne',
          targetPage: String(item.targetPage || 'Page catégorie ou produit').trim(),
          recommendation: String(
            item.recommendation ||
              `Intégrer "${String(item.keyword || baseKeyword).trim()}" dans le H1, la balise title et les arguments d'achat.`
          ).trim(),
        }))
    : [];

  const fallbackTemplates = [
    {
      keyword: `acheter ${baseKeyword}`,
      intent: 'Transactionnel direct',
      estimatedVolume: '500 - 1 800 / mois',
      difficulty: 'Moyenne',
      targetPage: 'Page catégorie principale',
      recommendation: `Cibler cette requête sur la page collection principale avec prix et livraison visibles dès le haut de page.`,
    },
    {
      keyword: `${baseKeyword} en ligne`,
      intent: 'Achat e-commerce',
      estimatedVolume: '400 - 1 400 / mois',
      difficulty: 'Moyenne',
      targetPage: 'Page accueil / catégorie',
      recommendation: `Mettre en avant l'expédition rapide et les garanties client dans la meta description.`,
    },
    {
      keyword: `meilleur ${baseKeyword} ${country.toLowerCase()}`,
      intent: 'Comparatif pré-achat',
      estimatedVolume: '300 - 900 / mois',
      difficulty: 'Moyenne',
      targetPage: 'Guide d’achat / collection',
      recommendation: `Créer un comparatif clair avec tableau de caractéristiques et preuves d'avis clients.`,
    },
    {
      keyword: `${baseKeyword} pas cher`,
      intent: 'Transactionnel prix',
      estimatedVolume: '600 - 2 200 / mois',
      difficulty: 'Élevée',
      targetPage: 'Page offres / packs',
      recommendation: `Proposer des lots ou offres découverte sans dégrader l'image de marque.`,
    },
    {
      keyword: `${baseKeyword} qualité professionnelle`,
      intent: 'Transactionnel premium',
      estimatedVolume: '200 - 700 / mois',
      difficulty: 'Faible',
      targetPage: 'Fiche produit phare',
      recommendation: `Détailler les matériaux, certifications et cas d'usage sur la fiche produit.`,
    },
    {
      keyword: `coffret ${baseKeyword} cadeau`,
      intent: 'Achat saisonnier',
      estimatedVolume: '250 - 950 / mois',
      difficulty: 'Faible',
      targetPage: 'Page coffret / bundle',
      recommendation: `Créer une page dédiée aux coffrets avec emballage cadeau et livraison express.`,
    },
    {
      keyword: `commander ${baseKeyword} livraison rapide`,
      intent: 'Transactionnel urgent',
      estimatedVolume: '150 - 500 / mois',
      difficulty: 'Faible',
      targetPage: 'Fiche produit + FAQ livraison',
      recommendation: `Afficher les délais d'expédition en 24/48h et les données structurées Offer.`,
    },
    {
      keyword: `${baseKeyword} ${niche.toLowerCase()}`,
      intent: 'Intention niche qualifiée',
      estimatedVolume: '350 - 1 100 / mois',
      difficulty: 'Faible',
      targetPage: 'Catégorie spécialisée',
      recommendation: `Structurer un texte éditorial de 300 mots sous la grille produits avec maillage interne.`,
    },
    {
      keyword: `prix ${baseKeyword}`,
      intent: 'Évaluation tarifaire',
      estimatedVolume: '300 - 1 000 / mois',
      difficulty: 'Moyenne',
      targetPage: 'Page catégorie + fiches',
      recommendation: `Activer les rich snippets Prix et Disponibilité via JSON-LD Product.`,
    },
    {
      keyword: `avis ${baseKeyword} ${niche.toLowerCase()}`,
      intent: 'Réassurance avant achat',
      estimatedVolume: '200 - 800 / mois',
      difficulty: 'Faible',
      targetPage: 'Fiche produit + section avis',
      recommendation: `Intégrer des avis vérifiés avec balisage AggregateRating sur chaque fiche.`,
    },
    {
      keyword: `${baseKeyword} naturel durable`,
      intent: 'Transactionnel engagé',
      estimatedVolume: '150 - 600 / mois',
      difficulty: 'Faible',
      targetPage: 'Collection éco-responsable',
      recommendation: `Valoriser la composition, l'origine et la durabilité dans les attributs filtrables.`,
    },
    {
      keyword: `boutique ${baseKeyword} ${country.toLowerCase()}`,
      intent: 'Recherche de marque locale',
      estimatedVolume: '250 - 850 / mois',
      difficulty: 'Moyenne',
      targetPage: 'Page d’accueil',
      recommendation: `Renforcer l'ancrage local dans la balise title et la page À propos.`,
    },
  ];

  const seen = new Set(cleaned.map((k) => k.keyword.toLowerCase()));
  const result = [...cleaned];
  for (const tpl of fallbackTemplates) {
    if (result.length >= 12) break;
    if (!seen.has(tpl.keyword.toLowerCase())) {
      seen.add(tpl.keyword.toLowerCase());
      result.push(tpl);
    }
  }

  return result.slice(0, 14);
}

function normalizeIssues(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i) => i && (i.title || i.fix))
    .map((i) => ({
      title: String(i.title || 'Point à optimiser').trim(),
      severity: ['Critique', 'Important', 'Optimisation'].includes(i.severity)
        ? i.severity
        : 'Important',
      impact: String(i.impact || 'Impact direct sur la visibilité organique et le taux de clic.').trim(),
      fix: String(i.fix || 'Appliquer la correction SEO recommandée sur le template concerné.').trim(),
    }));
}

function normalizeActionItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i) => i && i.task)
    .map((i) => ({
      task: String(i.task || '').trim(),
      priority: ['Haute', 'Moyenne', 'Normale'].includes(i.priority) ? i.priority : 'Moyenne',
      effort: String(i.effort || '1-2h').trim(),
      expectedGain: String(i.expectedGain || 'Hausse du trafic qualifié').trim(),
    }));
}

function clampScore(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function buildFallbackAuditReport(request, crawl, pageSpeed, customMessage) {
  const req = normalizeAuditRequest(request);
  const safeCrawl = crawl || buildDefaultCrawl(req.url);
  const safeSpeed = pageSpeed || buildDefaultPageSpeed();
  const hasTitle = Boolean(safeCrawl.homepage?.title);
  const hasMeta = Boolean(safeCrawl.homepage?.metaDescription);
  const hasH1 = Boolean(safeCrawl.homepage?.h1);

  return {
    globalScore: 50,
    isPartial: true,
    statusMessage: customMessage || 'Analyse partielle - données du site limitées',
    executiveSummary: `Audit de base généré pour ${safeCrawl.domain} (${req.platform}) sur la thématique "${req.niche}" et le mot-clé "${req.mainKeyword}". ${
      hasTitle
        ? `La page d'accueil expose un titre ("${safeCrawl.homepage.title.slice(0, 70)}")`
        : `Le crawl complet de la page d'accueil a renvoyé des données limitées`
    }, les recommandations ci-dessous priorisent la capture de trafic transactionnel en ${req.country}.`,
    scores: {
      technical: safeSpeed.mobileScore > 0 ? Math.round((safeSpeed.mobileScore + 55) / 2) : 48,
      onPage: hasTitle && hasMeta && hasH1 ? 62 : 44,
      semantic: 50,
      conversionSeo: 52,
    },
    technicalIssues: [
      {
        title: hasTitle ? 'Vérifier la longueur et l’unicité des balises Title' : 'Balise Title absente ou inaccessible au crawl',
        severity: 'Critique',
        impact: 'Réduit la pertinence sémantique et le CTR dans les résultats Google.',
        fix: `Rédiger une balise Title de 50-60 caractères incluant "${req.mainKeyword}" dès le début.`,
      },
      {
        title: hasMeta ? 'Optimiser la meta description pour le taux de clic' : 'Meta description manquante sur la page d’accueil',
        severity: 'Important',
        impact: 'Google réécrit l’extrait et les arguments commerciaux (livraison, avis) ne ressortent pas.',
        fix: `Ajouter une meta description de 140-155 caractères orientée bénéfices et réassurance.`,
      },
      {
        title: 'Données structurées E-Commerce (Product, Offer, BreadcrumbList)',
        severity: 'Important',
        impact: 'Prive vos fiches produits des résultats enrichis (prix, stock, étoiles d’avis).',
        fix: `Déployer un JSON-LD Product complet sur ${req.platform} et vérifier via le test de résultats enrichis.`,
      },
    ],
    onPageFindings: [
      {
        title: hasH1 ? 'Alignement du H1 avec l’intention d’achat' : 'Balise H1 principale non détectée',
        severity: 'Critique',
        impact: 'Le H1 est un signal majeur pour positionner la boutique sur les requêtes commerciales.',
        fix: `Placer un H1 unique visible intégrant "${req.mainKeyword}" et une proposition de valeur claire.`,
      },
      {
        title: 'Architecture des pages catégories et textes SEO',
        severity: 'Important',
        impact: 'Les pages collections sans texte descriptif peinent à se positionner face aux concurrents.',
        fix: `Ajouter 250 à 400 mots structurés en H2/H3 sous la grille produit de chaque collection.`,
      },
    ],
    transactionalKeywords: ensureTransactionalKeywords([], req),
    competitorInsights: req.competitors
      ? [
          `Analyser la structure des collections des concurrents (${req.competitors}) pour identifier les sous-catégories manquantes.`,
          `Comparer la richesse des fiches produits (FAQ intégrée, guides des tailles/usages, avis clients).`,
        ]
      : [
          `Structurer des pages catégories par besoin client et usage dans la niche "${req.niche}".`,
          `Développer des comparatifs et guides d'achat reliés aux fiches produits phares.`,
        ],
    platformTips: [
      `Sur ${req.platform}, surveiller les URLs de filtres et paramètres (?sort_by, ?page, facettes) pour éviter le contenu dupliqué.`,
      `Compresser toutes les images produits en WebP/AVIF avec attributs alt descriptifs incluant le nom exact du produit.`,
    ],
    actionPlan: {
      urgent: [
        {
          task: `Corriger Title, Meta Description et H1 de la page d'accueil autour de "${req.mainKeyword}"`,
          priority: 'Haute',
          effort: '1h',
          expectedGain: '+15 à +25% de CTR sur les impressions existantes',
        },
        {
          task: 'Vérifier l’indexation robots.txt, sitemap.xml et balises canonical',
          priority: 'Haute',
          effort: '2h',
          expectedGain: 'Suppression des pages parasites dans l’index Google',
        },
      ],
      mediumTerm: [
        {
          task: `Enrichir les 5 catégories principales (${req.niche}) avec contenu SEO et FAQ`,
          priority: 'Moyenne',
          effort: '4-6h',
          expectedGain: 'Positionnement top 10 sur les requêtes transactionnelles',
        },
        {
          task: 'Déployer le maillage interne entre articles guides et fiches produits',
          priority: 'Moyenne',
          effort: '3h',
          expectedGain: 'Transmission d’autorité vers les pages à forte marge',
        },
      ],
      longTerm: [
        {
          task: 'Programme mensuel de contenus éditoriaux ciblant la longue traîne et acquisition de backlinks niche',
          priority: 'Normale',
          effort: 'Continu',
          expectedGain: 'Croissance organique durable hors coût publicitaire',
        },
      ],
    },
  };
}

export function normalizeReport(rawReport, request, crawl, pageSpeed) {
  const req = normalizeAuditRequest(request);
  const safeCrawl = crawl || buildDefaultCrawl(req.url);
  const safeSpeed = pageSpeed || buildDefaultPageSpeed();

  if (!rawReport || typeof rawReport !== 'object') {
    return buildFallbackAuditReport(req, safeCrawl, safeSpeed);
  }

  const fallback = buildFallbackAuditReport(req, safeCrawl, safeSpeed);
  const rawScores = rawReport.scores && typeof rawReport.scores === 'object' ? rawReport.scores : {};
  const rawPlan = rawReport.actionPlan && typeof rawReport.actionPlan === 'object' ? rawReport.actionPlan : {};

  const technicalIssues = normalizeIssues(rawReport.technicalIssues);
  const onPageFindings = normalizeIssues(rawReport.onPageFindings);
  const urgent = normalizeActionItems(rawPlan.urgent);
  const mediumTerm = normalizeActionItems(rawPlan.mediumTerm);
  const longTerm = normalizeActionItems(rawPlan.longTerm);

  return {
    globalScore: clampScore(rawReport.globalScore, 50),
    isPartial: Boolean(rawReport.isPartial),
    statusMessage: String(
      rawReport.statusMessage ||
        (rawReport.isPartial
          ? 'Analyse partielle - données du site limitées'
          : 'Audit SEO complet généré')
    ).trim(),
    executiveSummary: String(rawReport.executiveSummary || fallback.executiveSummary).trim(),
    scores: {
      technical: clampScore(rawScores.technical, fallback.scores.technical),
      onPage: clampScore(rawScores.onPage, fallback.scores.onPage),
      semantic: clampScore(rawScores.semantic, fallback.scores.semantic),
      conversionSeo: clampScore(rawScores.conversionSeo, fallback.scores.conversionSeo),
    },
    technicalIssues: technicalIssues.length > 0 ? technicalIssues : fallback.technicalIssues,
    onPageFindings: onPageFindings.length > 0 ? onPageFindings : fallback.onPageFindings,
    transactionalKeywords: ensureTransactionalKeywords(rawReport.transactionalKeywords, req),
    competitorInsights:
      Array.isArray(rawReport.competitorInsights) && rawReport.competitorInsights.length > 0
        ? rawReport.competitorInsights.map((s) => String(s || '').trim()).filter(Boolean)
        : fallback.competitorInsights,
    platformTips:
      Array.isArray(rawReport.platformTips) && rawReport.platformTips.length > 0
        ? rawReport.platformTips.map((s) => String(s || '').trim()).filter(Boolean)
        : fallback.platformTips,
    actionPlan: {
      urgent: urgent.length > 0 ? urgent : fallback.actionPlan.urgent,
      mediumTerm: mediumTerm.length > 0 ? mediumTerm : fallback.actionPlan.mediumTerm,
      longTerm: longTerm.length > 0 ? longTerm : fallback.actionPlan.longTerm,
    },
  };
}
