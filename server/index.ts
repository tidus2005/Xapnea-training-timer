import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sessionsRouter from './routes/sessions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 7010;
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use('/api', sessionsRouter);

// Serve built frontend when dist exists (after npm run build / restart)
const fs = await import('fs');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  if (fs.existsSync(dist)) {
    console.log(`Frontend: http://localhost:${port}`);
  }
});
