import { buildDefaultCrawl, buildDefaultPageSpeed, extractDomain, normalizeUrl } from './auditHelpers.js';

function decodeHtmlEntities(str = '') {
  return String(str)
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html = '') {
  return decodeHtmlEntities(String(html).replace(/<[^>]+>/g, ' '));
}

function extractTagContent(html, regex) {
  const match = html.match(regex);
  return match && match[1] ? stripTags(match[1]) : '';
}

function extractLinks(html, baseUrl) {
  const categories = new Set();
  const products = new Set();
  const hrefRegex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    if (!rawHref || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) {
      continue;
    }
    try {
      const resolved = new URL(rawHref, baseUrl);
      const pathLower = resolved.pathname.toLowerCase();
      if (
        pathLower.includes('/collections') ||
        pathLower.includes('/category') ||
        pathLower.includes('/categorie') ||
        pathLower.includes('/product-category')
      ) {
        categories.add(resolved.pathname);
      } else if (
        pathLower.includes('/products') ||
        pathLower.includes('/product/') ||
        pathLower.includes('/produit/') ||
        pathLower.endsWith('.html')
      ) {
        products.add(resolved.pathname);
      }
    } catch {
      // Ignore malformed relative href
    }
  }

  return {
    categories: Array.from(categories).slice(0, 10),
    products: Array.from(products).slice(0, 12),
  };
}

export async function crawlStore(rawUrl) {
  const url = normalizeUrl(rawUrl);
  const baseCrawl = buildDefaultCrawl(url);
  const domain = extractDomain(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOBoutiqueIA/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return {
        ...baseCrawl,
        crawlSuccess: false,
        crawlNote: `Réponse HTTP ${response.status} lors de l'accès à ${domain}.`,
      };
    }

    const html = await response.text();
    const title = extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDescMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i);
    const metaDescription = metaDescMatch && metaDescMatch[1] ? decodeHtmlEntities(metaDescMatch[1]) : '';
    const h1 = extractTagContent(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    const canonical = canonicalMatch && canonicalMatch[1] ? canonicalMatch[1].trim() : '';
    const hasSchema = /application\/ld\+json/i.test(html);
    const bodyText = stripTags(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' '));
    const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
    const { categories, products } = extractLinks(html, url);

    return {
      domain,
      homepage: {
        url,
        title,
        metaDescription,
        h1,
        wordCount,
        hasSchema,
        canonical,
      },
      categories,
      products,
      crawlSuccess: true,
      crawlNote: title || h1 ? 'Page d’accueil analysée avec succès.' : 'Page HTML accessible mais balises SEO limitées.',
    };
  } catch (err) {
    return {
      ...baseCrawl,
      crawlSuccess: false,
      crawlNote: err?.name === 'AbortError' ? 'Délai de crawl dépassé (5s).' : 'Site protégé ou inaccessible au crawl direct.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPageSpeed(rawUrl) {
  const url = normalizeUrl(rawUrl);
  const fallback = buildDefaultPageSpeed();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`;
    const res = await fetch(endpoint, { signal: controller.signal });
    if (!res.ok) return fallback;
    const json = await res.json();
    const rawMobile = json?.lighthouseResult?.categories?.performance?.score;
    const mobileScore = typeof rawMobile === 'number' ? Math.round(rawMobile * 100) : 0;
    const desktopScore = mobileScore > 0 ? Math.min(100, mobileScore + 12) : 0;
    return { mobileScore, desktopScore };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}
