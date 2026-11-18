import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAMPLE_GSC_CSV,
  parseGscCsv,
  parseManualGscInput,
} from './gscParser';

test('parseGscCsv parses French semicolon CSV and detects opportunities', () => {
  const summary = parseGscCsv(SAMPLE_GSC_CSV);
  assert.equal(summary.topQueries.length, 9);
  assert.ok(summary.totals.clicks > 1000);
  assert.ok(summary.totals.impressions > 50000);
  assert.ok(summary.opportunities.length > 0);
  assert.equal(summary.topQueries[0].label, 'savon artisanal bio');
  assert.equal(summary.topQueries[0].clicks, 412);
});

test('parseGscCsv parses English comma CSV for top pages', () => {
  const csv = `Top pages,Clicks,Impressions,CTR,Position
https://shop.fr/collections/bio,300,15000,2.0%,6.5
https://shop.fr/products/creme,120,8000,1.5%,9.1`;
  const summary = parseGscCsv(csv);
  assert.equal(summary.topPages.length, 2);
  assert.equal(summary.totals.clicks, 420);
  assert.equal(summary.totals.impressions, 23000);
});

test('parseManualGscInput merges manual totals with pasted rows', () => {
  const summary = parseManualGscInput({
    clicks: '950',
    impressions: '42000',
    ctr: '2.26',
    avgPosition: '8.4',
    queriesText: 'crème hydratante bio; 200; 12000; 1.67%; 7.2',
    pagesText: '/collections/soins; 400; 18000; 2.22%; 6.0',
  });
  assert.equal(summary.totals.clicks, 950);
  assert.equal(summary.topQueries.length, 1);
  assert.equal(summary.topPages.length, 1);
  assert.ok(summary.opportunities.length >= 1);
});
