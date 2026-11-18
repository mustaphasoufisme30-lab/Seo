export default async function handler(req, res) {
  // Accepte POST de App.tsx + GET
  const body = req.body || {};
  const url = body.url || req.query.url;
  if (!url) return res.status(400).json({ error: "URL manquante" });

  const apiKey = process.env.PAGESPEED_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : "";

  async function getScore(strategy) {
    try {
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=seo&category=accessibility&category=best-practices${keyParam}`;
      const r = await fetch(apiUrl);
      const data = await r.json();
      if (!data.lighthouseResult) return 0;
      return Math.round(data.lighthouseResult.categories.performance.score * 100);
    } catch { return 0; }
  }

  try {
    const [mobileScore, desktopScore] = await Promise.all([
      getScore("mobile"),
      getScore("desktop"),
    ]);

    let domain = url;
    try { domain = new URL(url).hostname; } catch {}

    return res.status(200).json({
      request: { url, niche: body.niche || "", country: body.country || "FR" },
      crawl: {
        domain,
        homepage: { url, title: domain, metaDescription: "", h1: "" },
        categories: [],
        products: [],
      },
      pageSpeed: { mobileScore, desktopScore },
      report: {
        summary: `Audit réel Google PageSpeed pour ${domain} - Mobile: ${mobileScore}/100, Desktop: ${desktopScore}/100.`,
        scores: { mobileScore, desktopScore },
        keywords: [],
        actions: [
          { title: "Optimiser la vitesse mobile", priority: "high", detail: `Score mobile actuel : ${mobileScore}/100 selon Google.` },
          { title: "Optimiser la vitesse desktop", priority: "medium", detail: `Score desktop actuel : ${desktopScore}/100 selon Google.` },
        ],
      },
    });
  } catch (e) {
    return res.status(500).json({ error: "Erreur audit PageSpeed" });
  }
      }
