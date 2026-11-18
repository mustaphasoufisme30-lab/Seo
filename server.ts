import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import auditHandler from './api/audit.js';
import generateContentHandler from './api/generate-content.js';
import gscAnalyzeHandler from './api/gsc-analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'SEO Boutique IA' });
  });

  app.post('/api/audit', auditHandler);
  app.post('/api/generate-content', generateContentHandler);
  app.post('/api/gsc-analyze', gscAnalyzeHandler);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEO Boutique IA serveur actif sur http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erreur au démarrage du serveur:', err);
  process.exit(1);
});
