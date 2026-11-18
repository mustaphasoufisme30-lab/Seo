import {
  buildDefaultCrawl,
  buildDefaultPageSpeed,
  buildFallbackAuditReport,
  normalizeAuditRequest,
} from '../server/auditHelpers.js';
import { crawlStore, fetchPageSpeed } from '../server/crawl.js';
import { generateEcommerceSeoAudit } from '../server/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
    return;
  }

  const request = normalizeAuditRequest(req.body || {});
  let crawl = buildDefaultCrawl(request.url);
  let pageSpeed = buildDefaultPageSpeed();

  try {
    const [crawlRes, speedRes] = await Promise.allSettled([
      crawlStore(request.url),
      fetchPageSpeed(request.url),
    ]);

    if (crawlRes.status === 'fulfilled' && crawlRes.value) {
      crawl = {
        ...buildDefaultCrawl(request.url),
        ...crawlRes.value,
        homepage: {
          ...buildDefaultCrawl(request.url).homepage,
          ...(crawlRes.value.homepage || {}),
        },
        categories: Array.isArray(crawlRes.value.categories) ? crawlRes.value.categories : [],
        products: Array.isArray(crawlRes.value.products) ? crawlRes.value.products : [],
      };
    }

    if (speedRes.status === 'fulfilled' && speedRes.value) {
      pageSpeed = {
        mobileScore: Number(speedRes.value.mobileScore) || 0,
        desktopScore: Number(speedRes.value.desktopScore) || 0,
      };
    }

    const report = await generateEcommerceSeoAudit(request, crawl, pageSpeed);

    res.status(200).json({
      request,
      crawl,
      pageSpeed,
      report,
    });
  } catch (error) {
    console.error('Audit handler fallback:', error?.message || error);
    const report = buildFallbackAuditReport(
      request,
      crawl,
      pageSpeed,
      'Analyse partielle - données du site limitées'
    );
    res.status(200).json({
      request,
      crawl,
      pageSpeed,
      report,
    });
  }
}
