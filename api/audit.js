export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL manquante" });

  const apiKey = process.env.PAGESPEED_API_KEY;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const lighthouse = data.lighthouseResult;
    const categories = lighthouse.categories;

    res.status(200).json({
      url: url,
      performance: Math.round(categories.performance.score * 100),
      seo: Math.round(categories.seo.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories["best-practices"].score * 100),
      speed: lighthouse.audits["speed-index"].displayValue,
      lcp: lighthouse.audits["largest-contentful-paint"].displayValue,
      cls: lighthouse.audits["cumulative-layout-shift"].displayValue,
      audits: lighthouse.audits
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur audit" });
  }
}
