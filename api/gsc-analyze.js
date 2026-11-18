import { analyzeGscWithGemini, buildFallbackGscRecommendations } from '../server/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
    return;
  }

  const { summary, notes } = req.body || {};
  const safeSummary = summary || {
    totals: { clicks: 0, impressions: 0, ctr: 0, avgPosition: 0 },
    topQueries: [],
    topPages: [],
    opportunities: [],
    sourceMode: 'manual',
  };

  try {
    const analysis = await analyzeGscWithGemini(safeSummary, notes || '');
    res.status(200).json({
      summary: safeSummary,
      recommendations: analysis.recommendations,
      executiveNote: analysis.executiveNote,
    });
  } catch (error) {
    console.error('GSC analysis handler fallback:', error?.message || error);
    const fallback = buildFallbackGscRecommendations(safeSummary);
    res.status(200).json({
      summary: safeSummary,
      recommendations: fallback.recommendations,
      executiveNote: fallback.executiveNote,
    });
  }
}
