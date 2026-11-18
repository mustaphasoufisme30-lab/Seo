import { generateEcommerceContent, normalizeGeneratedContent } from '../server/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
    return;
  }

  const payload = req.body || {};
  try {
    const content = await generateEcommerceContent(payload);
    res.status(200).json({ content });
  } catch (error) {
    console.error('Content generation handler fallback:', error?.message || error);
    res.status(200).json({ content: normalizeGeneratedContent(null, payload) });
  }
}
