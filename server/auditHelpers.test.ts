import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDefaultCrawl,
  buildDefaultPageSpeed,
  buildFallbackAuditReport,
  ensureTransactionalKeywords,
  normalizeReport,
} from './auditHelpers.js';

test('buildDefaultCrawl returns exact default contract shape', () => {
  const crawl = buildDefaultCrawl('https://example.com');
  assert.equal(crawl.domain, 'example.com');
  assert.equal(crawl.homepage.url, 'https://example.com');
  assert.equal(crawl.homepage.title, '');
  assert.equal(crawl.homepage.metaDescription, '');
  assert.equal(crawl.homepage.h1, '');
  assert.deepEqual(crawl.categories, []);
  assert.deepEqual(crawl.products, []);
});

test('buildDefaultPageSpeed returns zeroed scores', () => {
  assert.deepEqual(buildDefaultPageSpeed(), { mobileScore: 0, desktopScore: 0 });
});

test('ensureTransactionalKeywords always produces 10 to 14 keywords even for empty site', () => {
  const kws = ensureTransactionalKeywords([], {
    url: 'https://example.com',
    platform: 'Shopify',
    mainKeyword: 'savon bio',
    niche: 'Cosmétiques naturels',
    country: 'France',
    competitors: '',
  });
  assert.ok(kws.length >= 10 && kws.length <= 14, `Expected 10-14 keywords, got ${kws.length}`);
  assert.ok(kws.some((k) => k.keyword.toLowerCase().includes('savon bio')));
});

test('buildFallbackAuditReport returns globalScore 50 and partial status message', () => {
  const req = {
    url: 'https://example.com',
    platform: 'Shopify',
    mainKeyword: 'café bio',
    niche: 'Épicerie fine',
    country: 'France',
    competitors: '',
  };
  const crawl = buildDefaultCrawl(req.url);
  const speed = buildDefaultPageSpeed();
  const report = buildFallbackAuditReport(req, crawl, speed);

  assert.equal(report.globalScore, 50);
  assert.equal(report.isPartial, true);
  assert.equal(report.statusMessage, 'Analyse partielle - données du site limitées');
  assert.ok(report.transactionalKeywords.length >= 10 && report.transactionalKeywords.length <= 14);
});

test('normalizeReport fills missing fields safely', () => {
  const req = {
    url: 'https://maboutique.fr',
    platform: 'WooCommerce',
    mainKeyword: 'miel de lavande',
    niche: 'Apiculture',
    country: 'France',
    competitors: '',
  };
  const report = normalizeReport(
    { globalScore: 78, transactionalKeywords: [{ keyword: 'acheter miel de lavande' }] },
    req,
    buildDefaultCrawl(req.url),
    buildDefaultPageSpeed()
  );

  assert.equal(report.globalScore, 78);
  assert.ok(report.transactionalKeywords.length >= 10 && report.transactionalKeywords.length <= 14);
  assert.ok(report.actionPlan.urgent.length > 0);
  assert.ok(report.technicalIssues.length > 0);
});
