import { jsPDF } from 'jspdf';
import type {
  AuditApiResponse,
  GeneratedContent,
  GscAnalysisResponse,
} from '../types/seo';

function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pdfSafeText(text: unknown): string {
  return String(text ?? '')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/→/g, '->')
    .replace(/€/g, 'EUR')
    .replace(/•/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, ' ');
}

export function downloadHtmlFile(filename: string, htmlContent: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildAuditHtml(data: Partial<AuditApiResponse> | null | undefined): string {
  const request = data?.request;
  const crawl = data?.crawl;
  const pageSpeed = data?.pageSpeed;
  const report = data?.report;

  const domain = crawl?.domain ?? request?.url ?? 'Boutique e-commerce';
  const keywords = report?.transactionalKeywords ?? [];
  const techIssues = report?.technicalIssues ?? [];
  const onPage = report?.onPageFindings ?? [];
  const urgent = report?.actionPlan?.urgent ?? [];
  const medium = report?.actionPlan?.mediumTerm ?? [];
  const longTerm = report?.actionPlan?.longTerm ?? [];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Audit SEO — ${escapeHtml(domain)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; max-width: 960px; margin: 40px auto; padding: 0 24px; line-height: 1.6; }
    h1, h2, h3 { color: #0f172a; }
    .meta { color: #475569; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 20px 0; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; }
    .kpi strong { display: block; font-size: 24px; color: #0f766e; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; }
    .section { margin-top: 28px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>Audit SEO E-Commerce — ${escapeHtml(domain)}</h1>
  <div class="meta">
    Plateforme : ${escapeHtml(request?.platform ?? 'Non précisée')} ·
    Mot-clé principal : ${escapeHtml(request?.mainKeyword ?? 'Non précisé')} ·
    Niche : ${escapeHtml(request?.niche ?? 'Non précisée')} ·
    Pays : ${escapeHtml(request?.country ?? 'France')}
  </div>

  <p><strong>Statut :</strong> ${escapeHtml(report?.statusMessage ?? 'Rapport généré')}</p>
  <p>${escapeHtml(report?.executiveSummary ?? '')}</p>

  <div class="grid">
    <div class="kpi"><span>Score Global</span><strong>${report?.globalScore ?? 0}/100</strong></div>
    <div class="kpi"><span>Technique</span><strong>${report?.scores?.technical ?? 0}/100</strong></div>
    <div class="kpi"><span>On-Page</span><strong>${report?.scores?.onPage ?? 0}/100</strong></div>
    <div class="kpi"><span>Sémantique</span><strong>${report?.scores?.semantic ?? 0}/100</strong></div>
    <div class="kpi"><span>PageSpeed Mobile</span><strong>${pageSpeed?.mobileScore ?? 0}/100</strong></div>
  </div>

  <div class="section">
    <h2>Données de crawl</h2>
    <p><strong>Title :</strong> ${escapeHtml(crawl?.homepage?.title || 'Non détecté')}</p>
    <p><strong>Meta Description :</strong> ${escapeHtml(crawl?.homepage?.metaDescription || 'Non détectée')}</p>
    <p><strong>H1 :</strong> ${escapeHtml(crawl?.homepage?.h1 || 'Non détecté')}</p>
  </div>

  <div class="section">
    <h2>Mots-clés transactionnels (${keywords.length})</h2>
    <table>
      <thead>
        <tr><th>Mot-clé</th><th>Intention</th><th>Volume</th><th>Difficulté</th><th>Page cible</th></tr>
      </thead>
      <tbody>
        ${keywords
          .map(
            (k) =>
              `<tr><td>${escapeHtml(k?.keyword)}</td><td>${escapeHtml(k?.intent)}</td><td>${escapeHtml(k?.estimatedVolume)}</td><td>${escapeHtml(k?.difficulty)}</td><td>${escapeHtml(k?.targetPage)}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Points techniques &amp; On-Page</h2>
    <ul>
      ${[...techIssues, ...onPage]
        .map(
          (i) =>
            `<li><strong>[${escapeHtml(i?.severity)}] ${escapeHtml(i?.title)}</strong> — ${escapeHtml(i?.impact)} <em>Correctif :</em> ${escapeHtml(i?.fix)}</li>`
        )
        .join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Plan d'action priorisé</h2>
    <h3>Actions urgentes</h3>
    <ul>${urgent.map((a) => `<li><strong>${escapeHtml(a?.task)}</strong> (${escapeHtml(a?.effort)}) — ${escapeHtml(a?.expectedGain)}</li>`).join('')}</ul>
    <h3>Moyen terme</h3>
    <ul>${medium.map((a) => `<li><strong>${escapeHtml(a?.task)}</strong> (${escapeHtml(a?.effort)}) — ${escapeHtml(a?.expectedGain)}</li>`).join('')}</ul>
    <h3>Long terme</h3>
    <ul>${longTerm.map((a) => `<li><strong>${escapeHtml(a?.task)}</strong> (${escapeHtml(a?.effort)}) — ${escapeHtml(a?.expectedGain)}</li>`).join('')}</ul>
  </div>
</body>
</html>`;
}

function createPdfWriter(title: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (needed = 10) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 18;
    }
  };

  const addHeading = (text: string, size = 13) => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(pdfSafeText(text), maxWidth);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 3;
  };

  const addParagraph = (text: string, size = 10, color: [number, number, number] = [51, 65, 85]) => {
    const safe = pdfSafeText(text).trim();
    if (!safe) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(safe, maxWidth);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 2;
  };

  addHeading(title, 16);
  return { doc, addHeading, addParagraph };
}

export function exportAuditPdf(data: Partial<AuditApiResponse> | null | undefined): void {
  const request = data?.request;
  const crawl = data?.crawl;
  const pageSpeed = data?.pageSpeed;
  const report = data?.report;
  const domain = crawl?.domain ?? request?.url ?? 'boutique';

  const { doc, addHeading, addParagraph } = createPdfWriter(
    `SEO Boutique IA - Audit SEO : ${domain}`
  );

  addParagraph(
    `Plateforme: ${request?.platform ?? '-'} | Mot-cle: ${request?.mainKeyword ?? '-'} | Niche: ${request?.niche ?? '-'} | Pays: ${request?.country ?? 'France'}`,
    9,
    [100, 116, 139]
  );

  addHeading(`Score Global : ${report?.globalScore ?? 0}/100`, 12);
  addParagraph(report?.statusMessage ?? '');
  addParagraph(report?.executiveSummary ?? '');

  addParagraph(
    `Scores détaillés - Technique: ${report?.scores?.technical ?? 0}/100 | On-Page: ${report?.scores?.onPage ?? 0}/100 | Sémantique: ${report?.scores?.semantic ?? 0}/100 | Conversion SEO: ${report?.scores?.conversionSeo ?? 0}/100 | PageSpeed Mobile: ${pageSpeed?.mobileScore ?? 0}/100`
  );

  addHeading('Crawl Page Accueil', 12);
  addParagraph(`Title: ${crawl?.homepage?.title || 'Non détecté'}`);
  addParagraph(`Meta Description: ${crawl?.homepage?.metaDescription || 'Non détectée'}`);
  addParagraph(`H1: ${crawl?.homepage?.h1 || 'Non détecté'}`);

  const keywords = report?.transactionalKeywords ?? [];
  addHeading(`Mots-clés transactionnels (${keywords.length})`, 12);
  for (const kw of keywords) {
    addParagraph(
      `- ${kw?.keyword ?? ''} (${kw?.estimatedVolume ?? '-'}, diff. ${kw?.difficulty ?? '-'}) -> ${kw?.targetPage ?? ''}`
    );
  }

  const issues = [...(report?.technicalIssues ?? []), ...(report?.onPageFindings ?? [])];
  addHeading('Anomalies Techniques & On-Page', 12);
  for (const issue of issues) {
    addParagraph(`[${issue?.severity ?? 'Info'}] ${issue?.title ?? ''} : ${issue?.fix ?? ''}`);
  }

  const urgent = report?.actionPlan?.urgent ?? [];
  const medium = report?.actionPlan?.mediumTerm ?? [];
  const longTerm = report?.actionPlan?.longTerm ?? [];
  addHeading('Plan d action priorisé', 12);
  for (const a of urgent) {
    addParagraph(`[Urgent] ${a?.task ?? ''} (${a?.effort ?? ''}) - ${a?.expectedGain ?? ''}`);
  }
  for (const a of medium) {
    addParagraph(`[Moyen terme] ${a?.task ?? ''} (${a?.effort ?? ''}) - ${a?.expectedGain ?? ''}`);
  }
  for (const a of longTerm) {
    addParagraph(`[Long terme] ${a?.task ?? ''} (${a?.effort ?? ''}) - ${a?.expectedGain ?? ''}`);
  }

  const slug = String(domain).replace(/[^a-z0-9.-]/gi, '-');
  doc.save(`audit-seo-${slug}.pdf`);
}

export function buildContentHtml(content: Partial<GeneratedContent> | null | undefined): string {
  const sections = content?.sections ?? [];
  const bullets = content?.bulletPoints ?? [];
  const faq = content?.faqItems ?? [];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(content?.metaTitle ?? 'Contenu SEO E-Commerce')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; max-width: 820px; margin: 40px auto; padding: 0 24px; line-height: 1.65; }
    .seo-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 24px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="seo-box">
    <div><strong>Meta Title :</strong> ${escapeHtml(content?.metaTitle ?? '')}</div>
    <div><strong>Meta Description :</strong> ${escapeHtml(content?.metaDescription ?? '')}</div>
    <div><strong>Slug URL :</strong> /${escapeHtml(content?.slug ?? '')}</div>
  </div>
  <h1>${escapeHtml(content?.h1 ?? 'Contenu SEO')}</h1>
  <p>${escapeHtml(content?.intro ?? '')}</p>
  ${sections.map((s) => `<h2>${escapeHtml(s?.heading)}</h2><p>${escapeHtml(s?.body)}</p>`).join('')}
  ${bullets.length ? `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
  ${
    faq.length
      ? `<h2>Questions fréquentes</h2>${faq
          .map((f) => `<h3>${escapeHtml(f?.question)}</h3><p>${escapeHtml(f?.answer)}</p>`)
          .join('')}`
      : ''
  }
  <p><strong>Appel à l'action :</strong> ${escapeHtml(content?.cta ?? '')}</p>
</body>
</html>`;
}

export function exportContentPdf(content: Partial<GeneratedContent> | null | undefined): void {
  const { doc, addHeading, addParagraph } = createPdfWriter(
    content?.h1 || 'Contenu SEO E-Commerce'
  );
  addParagraph(`Meta Title: ${content?.metaTitle ?? ''}`, 9, [100, 116, 139]);
  addParagraph(`Meta Description: ${content?.metaDescription ?? ''}`, 9, [100, 116, 139]);
  addParagraph(`Slug: /${content?.slug ?? ''}`, 9, [100, 116, 139]);
  addParagraph(content?.intro ?? '');

  for (const s of content?.sections ?? []) {
    addHeading(s?.heading ?? '', 12);
    addParagraph(s?.body ?? '');
  }
  for (const b of content?.bulletPoints ?? []) {
    addParagraph(`- ${b}`);
  }
  const faq = content?.faqItems ?? [];
  if (faq.length > 0) {
    addHeading('Questions fréquentes', 12);
    for (const f of faq) {
      addParagraph(`Q: ${f?.question ?? ''}`);
      addParagraph(`R: ${f?.answer ?? ''}`);
    }
  }
  if (content?.cta) {
    addHeading('Appel à l action', 11);
    addParagraph(content.cta);
  }
  doc.save(`contenu-seo-${content?.slug || 'boutique'}.pdf`);
}

export function buildGscHtml(data: Partial<GscAnalysisResponse> | null | undefined): string {
  const summary = data?.summary;
  const recs = data?.recommendations ?? [];
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Recommandations Google Search Console — SEO Boutique IA</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; max-width: 900px; margin: 40px auto; padding: 0 24px; line-height: 1.6; }
    .rec { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 14px; }
  </style>
</head>
<body>
  <h1>Analyse Google Search Console — SEO Boutique IA</h1>
  <p>Clics : ${summary?.totals?.clicks ?? 0} · Impressions : ${summary?.totals?.impressions ?? 0} · CTR moyen : ${summary?.totals?.ctr ?? 0}% · Position moyenne : ${summary?.totals?.avgPosition ?? 0}</p>
  <p>${escapeHtml(data?.executiveNote ?? '')}</p>
  ${recs
    .map(
      (r, idx) => `<div class="rec">
        <h3>${idx + 1}. ${escapeHtml(r?.title)} (${escapeHtml(r?.priority)})</h3>
        <p><strong>Catégorie :</strong> ${escapeHtml(r?.category)} · <strong>Cible :</strong> ${escapeHtml(r?.target)}</p>
        <p><strong>Constat :</strong> ${escapeHtml(r?.diagnosis)}</p>
        <p><strong>Action :</strong> ${escapeHtml(r?.action)}</p>
        <p><strong>Impact attendu :</strong> ${escapeHtml(r?.expectedImpact)}</p>
      </div>`
    )
    .join('')}
</body>
</html>`;
}

export function exportGscPdf(data: Partial<GscAnalysisResponse> | null | undefined): void {
  const summary = data?.summary;
  const { doc, addHeading, addParagraph } = createPdfWriter(
    'SEO Boutique IA - Recommandations Google Search Console'
  );
  addParagraph(
    `Clics: ${summary?.totals?.clicks ?? 0} | Impressions: ${summary?.totals?.impressions ?? 0} | CTR: ${summary?.totals?.ctr ?? 0}% | Position moyenne: ${summary?.totals?.avgPosition ?? 0}`
  );
  addParagraph(data?.executiveNote ?? '');
  for (const [idx, r] of (data?.recommendations ?? []).entries()) {
    addHeading(`${idx + 1}. ${r?.title ?? ''} [${r?.priority ?? ''}]`, 11);
    addParagraph(`Cible: ${r?.target ?? ''} | Categorie: ${r?.category ?? ''}`, 9, [100, 116, 139]);
    addParagraph(`Diagnostic: ${r?.diagnosis ?? ''}`);
    addParagraph(`Action: ${r?.action ?? ''}`);
    addParagraph(`Impact: ${r?.expectedImpact ?? ''}`);
  }
  doc.save('recommandations-gsc-seo-boutique.pdf');
}
