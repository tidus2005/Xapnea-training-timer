import 'dotenv/config';
import express from 'express';
import sessionsRouter from './routes/sessions.js';

const app = express();
const port = Number(process.env.PORT) || 7010;

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use('/api', sessionsRouter);

app.get('/', (_req, res) => {
  res.type('text/plain').status(200).send('API only. Frontend: http://localhost:3010');
});

app.listen(port, () => {
  console.log(`Backend (API) listening on http://localhost:${port}`);
});
