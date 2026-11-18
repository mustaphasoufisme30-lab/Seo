import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuditHtml, buildContentHtml, buildGscHtml } from './exportReport';

test('buildAuditHtml handles empty or partial data without crashing', () => {
  const html = buildAuditHtml({});
  assert.ok(html.includes('Audit SEO E-Commerce'));
  assert.ok(html.includes('0/100'));

  const nullHtml = buildAuditHtml(null);
  assert.ok(nullHtml.includes('<!DOCTYPE html>'));
});

test('buildContentHtml and buildGscHtml handle partial fields safely', () => {
  const contentHtml = buildContentHtml({ h1: 'Fiche Test' });
  assert.ok(contentHtml.includes('Fiche Test'));

  const gscHtml = buildGscHtml({ recommendations: [] });
  assert.ok(gscHtml.includes('Analyse Google Search Console'));
});
