import type { GscParsedSummary, GscRow } from '../types/seo';

function parseLocalizedNumber(raw: string | undefined): number {
  if (!raw) return 0;
  let cleaned = raw.replace(/\u00a0/g, '').replace(/\s+/g, '').replace(/%/g, '').trim();
  if (!cleaned) return 0;
  // Handle French decimal comma when there is no dot, e.g. "4,25" -> "4.25"
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = `${parts[0]}.${parts[1]}`;
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const tabs = (headerLine.match(/\t/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  if (tabs >= semicolons && tabs >= commas && tabs > 0) return '\t';
  if (semicolons >= commas && semicolons > 0) return ';';
  return ',';
}

function computeOpportunities(rows: GscRow[]) {
  const opps: GscParsedSummary['opportunities'] = [];
  for (const row of rows) {
    if (row.impressions >= 100 && row.ctr < 2.5) {
      opps.push({
        queryOrPage: row.label,
        reason: 'Fortes impressions mais CTR faible (< 2,5%) — réécrire Title & Meta',
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      });
    } else if (row.position >= 4 && row.position <= 18 && row.impressions >= 80) {
      opps.push({
        queryOrPage: row.label,
        reason: 'Quick-win Top 3 (position 4-18) — enrichir contenu & maillage',
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      });
    }
  }
  return opps.slice(0, 10);
}

function summarizeRows(rows: GscRow[], isPages: boolean, sourceMode: 'csv' | 'manual'): GscParsedSummary {
  const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0);
  const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
  const avgCtr =
    totalImpressions > 0
      ? Number(((totalClicks / totalImpressions) * 100).toFixed(2))
      : rows.length > 0
        ? Number((rows.reduce((s, r) => s + r.ctr, 0) / rows.length).toFixed(2))
        : 0;
  const avgPosition =
    rows.length > 0
      ? Number((rows.reduce((s, r) => s + r.position, 0) / rows.length).toFixed(1))
      : 0;

  return {
    totals: {
      clicks: Math.round(totalClicks),
      impressions: Math.round(totalImpressions),
      ctr: avgCtr,
      avgPosition,
    },
    topQueries: isPages ? [] : rows.slice(0, 20),
    topPages: isPages ? rows.slice(0, 20) : [],
    opportunities: computeOpportunities(rows),
    sourceMode,
  };
}

export function parseGscCsv(csvText: string): GscParsedSummary {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      totals: { clicks: 0, impressions: 0, ctr: 0, avgPosition: 0 },
      topQueries: [],
      topPages: [],
      opportunities: [],
      sourceMode: 'csv',
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());

  const labelIdx = 0;
  const clicksIdx = headers.findIndex((h) => h.includes('clic') || h.includes('click'));
  const impIdx = headers.findIndex((h) => h.includes('impression'));
  const ctrIdx = headers.findIndex((h) => h.includes('ctr'));
  const posIdx = headers.findIndex((h) => h.includes('pos'));

  const isPages =
    headers[0]?.includes('page') ||
    headers[0]?.includes('url') ||
    lines.slice(1, 5).some((l) => l.includes('http'));

  const rows: GscRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter);
    const label = (cols[labelIdx] || '').trim();
    if (!label) continue;

    const clicks = parseLocalizedNumber(cols[clicksIdx >= 0 ? clicksIdx : 1]);
    const impressions = parseLocalizedNumber(cols[impIdx >= 0 ? impIdx : 2]);
    let ctr = parseLocalizedNumber(cols[ctrIdx >= 0 ? ctrIdx : 3]);
    if (ctr === 0 && impressions > 0 && clicks > 0) {
      ctr = Number(((clicks / impressions) * 100).toFixed(2));
    }
    const position = parseLocalizedNumber(cols[posIdx >= 0 ? posIdx : 4]);

    rows.push({
      label,
      clicks,
      impressions,
      ctr: Number(ctr.toFixed(2)),
      position: Number(position.toFixed(1)),
    });
  }

  return summarizeRows(rows, isPages, 'csv');
}

export function parseLinesToRows(rawBlock: string): GscRow[] {
  const lines = String(rawBlock || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: GscRow[] = [];
  for (const line of lines) {
    // Support separators: ; | \t or comma
    let parts: string[];
    if (line.includes('|')) parts = line.split('|');
    else if (line.includes(';')) parts = line.split(';');
    else if (line.includes('\t')) parts = line.split('\t');
    else parts = line.split(',');

    const cleaned = parts.map((p) => p.trim()).filter(Boolean);
    if (cleaned.length === 0) continue;

    // Skip header-like line
    if (/^(requ[eê]te|query|page|url)/i.test(cleaned[0]) && /clic|click|impression/i.test(cleaned.join(' '))) {
      continue;
    }

    const label = cleaned[0];
    const clicks = parseLocalizedNumber(cleaned[1]);
    const impressions = parseLocalizedNumber(cleaned[2]);
    let ctr = parseLocalizedNumber(cleaned[3]);
    if (ctr === 0 && impressions > 0 && clicks > 0) {
      ctr = Number(((clicks / impressions) * 100).toFixed(2));
    }
    const position = parseLocalizedNumber(cleaned[4]);

    rows.push({
      label,
      clicks,
      impressions,
      ctr: Number(ctr.toFixed(2)),
      position: Number(position.toFixed(1)),
    });
  }

  return rows;
}

export interface ManualGscInput {
  clicks: string | number;
  impressions: string | number;
  ctr: string | number;
  avgPosition: string | number;
  queriesText: string;
  pagesText: string;
}

export function parseManualGscInput(input: ManualGscInput): GscParsedSummary {
  const topQueries = parseLinesToRows(input.queriesText);
  const topPages = parseLinesToRows(input.pagesText);

  const manualClicks = parseLocalizedNumber(String(input.clicks ?? ''));
  const manualImpressions = parseLocalizedNumber(String(input.impressions ?? ''));
  const manualCtr = parseLocalizedNumber(String(input.ctr ?? ''));
  const manualPos = parseLocalizedNumber(String(input.avgPosition ?? ''));

  const computedClicks =
    manualClicks > 0 ? manualClicks : topQueries.reduce((sum, r) => sum + r.clicks, 0);
  const computedImpressions =
    manualImpressions > 0
      ? manualImpressions
      : topQueries.reduce((sum, r) => sum + r.impressions, 0);
  const computedCtr =
    manualCtr > 0
      ? manualCtr
      : computedImpressions > 0
        ? Number(((computedClicks / computedImpressions) * 100).toFixed(2))
        : 0;
  const computedPos =
    manualPos > 0
      ? manualPos
      : topQueries.length > 0
        ? Number((topQueries.reduce((s, r) => s + r.position, 0) / topQueries.length).toFixed(1))
        : 0;

  return {
    totals: {
      clicks: Math.round(computedClicks),
      impressions: Math.round(computedImpressions),
      ctr: Number(computedCtr.toFixed(2)),
      avgPosition: Number(computedPos.toFixed(1)),
    },
    topQueries,
    topPages,
    opportunities: computeOpportunities([...topQueries, ...topPages]),
    sourceMode: 'manual',
  };
}

export const SAMPLE_GSC_CSV = `Requêtes les plus fréquentes;Clics;Impressions;CTR;Position
savon artisanal bio;412;14200;2,9%;5,4
savon saponifié à froid;285;18900;1,51%;6,8
coffret savon naturel cadeau;164;9800;1,67%;7,2
savon lait de chèvre visage;320;6100;5,25%;3,1
acheter savon solide bio france;95;5400;1,76%;9,4
shampoing solide sans sulfate;118;11200;1,05%;11,2
savon surgras peau sensible;210;4800;4,38%;4,2
savonnerie artisanale en ligne;64;4300;1,49%;13,5
recharge savon liquide bio;42;3600;1,17%;14,1`;
