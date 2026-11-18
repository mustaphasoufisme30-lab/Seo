import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildFallbackAuditReport,
  normalizeAuditRequest,
  normalizeReport,
  buildDefaultCrawl,
  buildDefaultPageSpeed,
} from './auditHelpers.js';

const MODEL_NAME = 'gemini-4-hydrogen';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const AUDIT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    globalScore: { type: Type.INTEGER, description: 'Score SEO global sur 100.' },
    isPartial: { type: Type.BOOLEAN },
    statusMessage: { type: Type.STRING },
    executiveSummary: { type: Type.STRING },
    scores: {
      type: Type.OBJECT,
      properties: {
        technical: { type: Type.INTEGER },
        onPage: { type: Type.INTEGER },
        semantic: { type: Type.INTEGER },
        conversionSeo: { type: Type.INTEGER },
      },
    },
    technicalIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          severity: { type: Type.STRING, description: 'Critique, Important, ou Optimisation' },
          impact: { type: Type.STRING },
          fix: { type: Type.STRING },
        },
      },
    },
    onPageFindings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          severity: { type: Type.STRING, description: 'Critique, Important, ou Optimisation' },
          impact: { type: Type.STRING },
          fix: { type: Type.STRING },
        },
      },
    },
    transactionalKeywords: {
      type: Type.ARRAY,
      description: 'Toujours entre 10 et 14 mots-clés transactionnels e-commerce pertinents.',
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          intent: { type: Type.STRING },
          estimatedVolume: { type: Type.STRING },
          difficulty: { type: Type.STRING, description: 'Faible, Moyenne, ou Élevée' },
          targetPage: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
      },
    },
    competitorInsights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    platformTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    actionPlan: {
      type: Type.OBJECT,
      properties: {
        urgent: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING },
              priority: { type: Type.STRING },
              effort: { type: Type.STRING },
              expectedGain: { type: Type.STRING },
            },
          },
        },
        mediumTerm: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING },
              priority: { type: Type.STRING },
              effort: { type: Type.STRING },
              expectedGain: { type: Type.STRING },
            },
          },
        },
        longTerm: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING },
              priority: { type: Type.STRING },
              effort: { type: Type.STRING },
              expectedGain: { type: Type.STRING },
            },
          },
        },
      },
    },
  },
};

export async function generateEcommerceSeoAudit(request, crawl, pageSpeed) {
  const safeReq = normalizeAuditRequest(request);
  const safeCrawl = crawl || buildDefaultCrawl(safeReq.url);
  const safePageSpeed = pageSpeed || buildDefaultPageSpeed();

  const ai = getClient();
  if (!ai) {
    return buildFallbackAuditReport(
      safeReq,
      safeCrawl,
      safePageSpeed,
      'Analyse partielle - données du site limitées'
    );
  }

  const isEmptySite =
    !safeCrawl.homepage?.title &&
    !safeCrawl.homepage?.h1 &&
    (!safeCrawl.categories || safeCrawl.categories.length === 0);

  const prompt = `Tu es un consultant senior SEO e-commerce francophone.
Analyse cette boutique et produis un audit SEO complet, concret et actionnable EN FRANÇAIS.

PARAMÈTRES UTILISATEUR :
- URL : ${safeReq.url}
- Plateforme : ${safeReq.platform}
- Mot-clé principal : ${safeReq.mainKeyword}
- Niche : ${safeReq.niche}
- Pays cible : ${safeReq.country}
- Concurrents mentionnés : ${safeReq.competitors || 'Non précisés'}

DONNÉES DE CRAWL RÉELLES :
- Domaine : ${safeCrawl.domain}
- Title homepage : "${safeCrawl.homepage?.title || ''}"
- Meta Description homepage : "${safeCrawl.homepage?.metaDescription || ''}"
- H1 homepage : "${safeCrawl.homepage?.h1 || ''}"
- Nb mots estimé : ${safeCrawl.homepage?.wordCount || 0}
- Schema JSON-LD détecté : ${safeCrawl.homepage?.hasSchema ? 'Oui' : 'Non'}
- Catégories détectées (${safeCrawl.categories?.length || 0}) : ${(safeCrawl.categories || []).join(', ') || 'Aucune'}
- Produits détectés (${safeCrawl.products?.length || 0}) : ${(safeCrawl.products || []).join(', ') || 'Aucun'}
- PageSpeed Mobile : ${safePageSpeed.mobileScore}/100 | Desktop : ${safePageSpeed.desktopScore}/100

CONSIGNES STRICTES :
1. Génère TOUJOURS entre 10 et 14 mots-clés transactionnels pertinents.
${isEmptySite ? `2. ATTENTION : le crawl du site est vide ou très limité (ex: example.com ou site bloqué). Génère IMPÉRATIVEMENT les 10 à 14 mots-clés transactionnels à partir du mot-clé principal ("${safeReq.mainKeyword}") et de la niche ("${safeReq.niche}") pour le marché "${safeReq.country}". Indique isPartial: true.` : '2. Base tes constats sur les balises détectées et complète avec les bonnes pratiques spécifiques à ' + safeReq.platform + '.'}
3. Fournis au moins 3 problèmes techniques, 3 constats on-page, 3 conseils plateforme ${safeReq.platform}, et un plan d'action structuré (urgent, mediumTerm, longTerm).`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          'Tu réponds uniquement en JSON valide conforme au schéma fourni. Tout le contenu textuel doit être en français professionnel et orienté ROI e-commerce.',
        responseMimeType: 'application/json',
        responseSchema: AUDIT_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const rawText = (response?.text || '').trim();
    if (!rawText) {
      return buildFallbackAuditReport(safeReq, safeCrawl, safePageSpeed);
    }

    const parsed = JSON.parse(rawText);
    return normalizeReport(parsed, safeReq, safeCrawl, safePageSpeed);
  } catch (error) {
    console.error('Gemini audit generation fallback:', error?.message || error);
    return buildFallbackAuditReport(
      safeReq,
      safeCrawl,
      safePageSpeed,
      'Analyse partielle - données du site limitées'
    );
  }
}

const CONTENT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    metaTitle: { type: Type.STRING },
    metaDescription: { type: Type.STRING },
    h1: { type: Type.STRING },
    slug: { type: Type.STRING },
    intro: { type: Type.STRING },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          body: { type: Type.STRING },
        },
      },
    },
    bulletPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    faqItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
      },
    },
    cta: { type: Type.STRING },
    seoChecklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

export function normalizeGeneratedContent(raw, req) {
  const type = ['product', 'category', 'blog', 'faq'].includes(req?.type) ? req.type : 'product';
  const topic = String(req?.topic || 'Produit phare').trim();
  const kw = String(req?.mainKeyword || topic).trim();
  const slugBase = kw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const safeSections = Array.isArray(raw?.sections)
    ? raw.sections
        .filter((s) => s && (s.heading || s.body))
        .map((s) => ({
          heading: String(s.heading || 'Présentation').trim(),
          body: String(s.body || '').trim(),
        }))
    : [];

  const safeFaq = Array.isArray(raw?.faqItems)
    ? raw.faqItems
        .filter((f) => f && f.question)
        .map((f) => ({
          question: String(f.question || '').trim(),
          answer: String(f.answer || '').trim(),
        }))
    : [];

  return {
    type,
    metaTitle: String(raw?.metaTitle || `${topic} — ${kw} | Boutique Officielle`).slice(0, 68),
    metaDescription: String(
      raw?.metaDescription ||
        `Découvrez ${topic} (${kw}). Qualité sélectionnée, livraison rapide et avis clients vérifiés. Commandez en ligne dès aujourd'hui.`
    ).slice(0, 165),
    h1: String(raw?.h1 || `${topic} : ${kw}`).trim(),
    slug: String(raw?.slug || slugBase || 'page-seo').trim(),
    intro: String(
      raw?.intro ||
        `Conçu pour répondre aux exigences de ${req?.audience || 'vos clients'}, ${topic} associe performance et fiabilité au quotidien.`
    ).trim(),
    sections:
      safeSections.length > 0
        ? safeSections
        : [
            {
              heading: `Pourquoi choisir ${topic} ?`,
              body: `Notre sélection ${kw} répond aux critères de qualité les plus exigeants dans le secteur ${req?.niche || 'e-commerce'}.`,
            },
          ],
    bulletPoints:
      Array.isArray(raw?.bulletPoints) && raw.bulletPoints.length > 0
        ? raw.bulletPoints.map((b) => String(b || '').trim()).filter(Boolean)
        : [
            `Optimisé pour la requête principale "${kw}"`,
            'Expédition rapide et suivi colis en temps réel',
            'Garantie satisfaction et support client réactif',
          ],
    faqItems:
      safeFaq.length > 0
        ? safeFaq
        : [
            {
              question: `Quels sont les délais de livraison pour ${topic} ?`,
              answer: 'Les commandes sont expédiées sous 24 à 48 heures ouvrées avec numéro de suivi.',
            },
            {
              question: `Comment entretenir ou utiliser ${topic} au quotidien ?`,
              answer: 'Suivez les recommandations d’usage incluses dans la notice détaillée pour préserver la longévité.',
            },
          ],
    cta: String(raw?.cta || `Commander ${topic} maintenant`).trim(),
    seoChecklist:
      Array.isArray(raw?.seoChecklist) && raw.seoChecklist.length > 0
        ? raw.seoChecklist.map((c) => String(c || '').trim()).filter(Boolean)
        : [
            `Mot-clé "${kw}" présent dans le Title, le H1 et l'introduction`,
            'Structure hiérarchisée H1 > H2 adaptée à la lecture rapide',
            'Questions FAQ prêtes pour le balisage JSON-LD FAQPage',
          ],
  };
}

export async function generateEcommerceContent(payload) {
  const ai = getClient();
  const typeLabels = {
    product: 'Fiche produit e-commerce haute conversion',
    category: 'Description SEO de page catégorie / collection',
    blog: 'Article de blog éditorial orienté acquisition e-commerce',
    faq: 'Page FAQ complète et structurée pour rich snippets',
  };

  if (!ai) {
    return normalizeGeneratedContent(null, payload);
  }

  const prompt = `Tu es un rédacteur SEO e-commerce expert en français.
Génère un contenu de type : ${typeLabels[payload.type] || typeLabels.product}

DÉTAILS :
- Sujet / Produit / Catégorie : ${payload.topic}
- Mot-clé principal : ${payload.mainKeyword}
- Mots-clés secondaires : ${payload.secondaryKeywords || 'À déduire naturellement'}
- Niche : ${payload.niche || 'E-commerce'}
- Ton éditorial : ${payload.tone || 'Expert, rassurant et orienté conversion'}
- Audience cible : ${payload.audience || 'Acheteurs en ligne'}
- Arguments clés : ${payload.keyBenefits || 'Qualité, durabilité, livraison rapide'}

Produis un contenu structuré, naturel (sans bourrage de mots-clés), directement exploitable sur Shopify, WooCommerce ou PrestaShop.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: 'Réponds uniquement en JSON valide en français conforme au schéma.',
        responseMimeType: 'application/json',
        responseSchema: CONTENT_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    const parsed = JSON.parse((response?.text || '{}').trim());
    return normalizeGeneratedContent(parsed, payload);
  } catch (err) {
    console.error('Gemini content generation fallback:', err?.message || err);
    return normalizeGeneratedContent(null, payload);
  }
}

const GSC_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executiveNote: { type: Type.STRING },
    recommendations: {
      type: Type.ARRAY,
      description: 'Entre 6 et 8 recommandations SEO prioritaires.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: {
            type: Type.STRING,
            description: 'CTR & Balises, Contenu & Position, Maillage interne, ou Technique & Indexation',
          },
          priority: { type: Type.STRING, description: 'Haute, Moyenne, ou Opportunité' },
          target: { type: Type.STRING },
          diagnosis: { type: Type.STRING },
          action: { type: Type.STRING },
          expectedImpact: { type: Type.STRING },
        },
      },
    },
  },
};

export function buildFallbackGscRecommendations(summary) {
  const topQuery = summary?.topQueries?.[0]?.label || 'requête principale';
  const oppQuery = summary?.opportunities?.[0]?.queryOrPage || topQuery;
  const topPage = summary?.topPages?.[0]?.label || '/collections/catalogue';

  const recs = [
    {
      title: 'Optimiser les balises Title des pages à fort volume d’impressions',
      category: 'CTR & Balises',
      priority: 'Haute',
      target: oppQuery,
      diagnosis: `Des impressions importantes sont enregistrées avec un CTR perfectible.`,
      action: `Réécrire la balise Title en plaçant l'intention d'achat et un élément différenciant (livraison, stock, avis) dans les 55 premiers caractères.`,
      expectedImpact: '+20% à +35% de clics sans gagner de position.',
    },
    {
      title: 'Pousser les requêtes positionnées entre 4 et 15 vers le Top 3',
      category: 'Contenu & Position',
      priority: 'Haute',
      target: topQuery,
      diagnosis: `Plusieurs mots-clés génèrent déjà des impressions en bas de page 1 ou haut de page 2.`,
      action: `Enrichir les sections H2/H3 de la page cible avec des réponses aux questions clients et ajouter 3 liens internes depuis les articles de blog.`,
      expectedImpact: 'Doublement potentiel du trafic organique sur ces expressions.',
    },
    {
      title: 'Renforcer le maillage interne vers les pages catégories rentables',
      category: 'Maillage interne',
      priority: 'Haute',
      target: topPage,
      diagnosis: `La page principale concentre les clics mais doit redistribuer ou recevoir plus d'ancres optimisées.`,
      action: `Ajouter des liens contextuels dans le texte de présentation et relier les sous-catégories sœurs.`,
      expectedImpact: 'Meilleure indexation et stabilité des positions.',
    },
    {
      title: 'Corriger les meta descriptions tronquées ou génériques',
      category: 'CTR & Balises',
      priority: 'Moyenne',
      target: 'Pages produits et collections',
      diagnosis: `Un CTR inférieur à 2% sur les requêtes non-marque indique un snippet peu incitatif.`,
      action: `Inclure un bénéfice mesurable, le prix ou le délai d'expédition dans chaque meta description.`,
      expectedImpact: 'Amélioration immédiate du taux de clic mobile.',
    },
    {
      title: 'Ajouter des données structurées Product et FAQPage',
      category: 'Technique & Indexation',
      priority: 'Moyenne',
      target: 'Templates fiches produits',
      diagnosis: `Les extraits enrichis augmentent la surface visuelle dans la SERP face aux marketplaces.`,
      action: `Valider le JSON-LD Offer, AggregateRating et FAQPage sur les 10 URLs les plus imprimées.`,
      expectedImpact: 'Meilleure visibilité visuelle sur mobile.',
    },
    {
      title: 'Identifier et fusionner les pages en cannibalisation',
      category: 'Contenu & Position',
      priority: 'Opportunité',
      target: 'Requêtes multi-URLs',
      diagnosis: `Plusieurs fiches ou articles peuvent se concurrencer sur une même intention commerciale.`,
      action: `Désigner une URL canonique principale par groupe de mots-clés et rediriger ou différencier les variantes.`,
      expectedImpact: 'Consolidation de la pertinence et gain de 2 à 5 places.',
    },
    {
      title: 'Créer des pages dédiées pour les requêtes émergentes sans URL cible',
      category: 'Contenu & Position',
      priority: 'Opportunité',
      target: 'Requêtes longue traîne GSC',
      diagnosis: `Google teste vos pages actuelles sur des requêtes connexes non traitées en profondeur.`,
      action: `Créer une sous-collection ou un guide comparatif dédié aux requêtes dépassant 200 impressions/mois.`,
      expectedImpact: 'Capture de nouveaux segments d’acheteurs qualifiés.',
    },
  ];

  return {
    executiveNote: `Analyse synthétisée sur ${summary?.totals?.clicks || 0} clics et ${summary?.totals?.impressions || 0} impressions (CTR moyen ${summary?.totals?.ctr || 0}%). Voici 7 actions priorisées pour transformer vos impressions en ventes.`,
    recommendations: recs,
  };
}

export async function analyzeGscWithGemini(summary, rawNotes = '') {
  const ai = getClient();
  if (!ai) {
    return buildFallbackGscRecommendations(summary);
  }

  const prompt = `Tu es un expert SEO e-commerce. Analyse ces données exportées de Google Search Console (sans connexion API, fournies par le marchand) et donne EXACTEMENT 6 à 8 recommandations concrètes, chiffrées et actionnables EN FRANÇAIS.

TOTAUX :
- Clics : ${summary?.totals?.clicks || 0}
- Impressions : ${summary?.totals?.impressions || 0}
- CTR moyen : ${summary?.totals?.ctr || 0}%
- Position moyenne : ${summary?.totals?.avgPosition || 0}

TOP REQUÊTES :
${(summary?.topQueries || []).slice(0, 12).map((q) => `- "${q.label}" : ${q.clicks} clics, ${q.impressions} imp., CTR ${q.ctr}%, pos ${q.position}`).join('\n') || 'Non fournies'}

TOP PAGES :
${(summary?.topPages || []).slice(0, 10).map((p) => `- ${p.label} : ${p.clicks} clics, ${p.impressions} imp., CTR ${p.ctr}%, pos ${p.position}`).join('\n') || 'Non fournies'}

OPPORTUNITÉS DÉTECTÉES LOCALEMENT :
${(summary?.opportunities || []).slice(0, 8).map((o) => `- ${o.queryOrPage} (${o.reason}) : ${o.impressions} imp., CTR ${o.ctr}%, pos ${o.position}`).join('\n') || 'Aucune spécifique'}

NOTES MARCHAND : ${rawNotes || 'Aucune'}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: 'Réponds uniquement en JSON valide conforme au schéma, avec 6 à 8 recommandations précises en français.',
        responseMimeType: 'application/json',
        responseSchema: GSC_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    const parsed = JSON.parse((response?.text || '{}').trim());
    const validCategories = [
      'CTR & Balises',
      'Contenu & Position',
      'Maillage interne',
      'Technique & Indexation',
    ];
    const validPriorities = ['Haute', 'Moyenne', 'Opportunité'];
    const recs = Array.isArray(parsed?.recommendations)
      ? parsed.recommendations
          .filter((r) => r && r.title)
          .map((r) => ({
            title: String(r.title).trim(),
            category: validCategories.includes(r.category) ? r.category : 'Contenu & Position',
            priority: validPriorities.includes(r.priority) ? r.priority : 'Moyenne',
            target: String(r.target || 'Pages principales').trim(),
            diagnosis: String(r.diagnosis || '').trim(),
            action: String(r.action || '').trim(),
            expectedImpact: String(r.expectedImpact || 'Progression du trafic organique').trim(),
          }))
      : [];

    const fallback = buildFallbackGscRecommendations(summary);
    const merged = [...recs];
    for (const item of fallback.recommendations) {
      if (merged.length >= 7) break;
      if (!merged.some((m) => m.title.toLowerCase() === item.title.toLowerCase())) {
        merged.push(item);
      }
    }

    return {
      executiveNote: String(parsed?.executiveNote || fallback.executiveNote).trim(),
      recommendations: merged.slice(0, 8),
    };
  } catch (err) {
    console.error('Gemini GSC analysis fallback:', err?.message || err);
    return buildFallbackGscRecommendations(summary);
  }
}
