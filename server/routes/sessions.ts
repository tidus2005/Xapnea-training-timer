import { Router } from 'express';
import db from '../db.js';
import type { SessionRecord, RoundRecord } from '../types.js';

const router = Router();

router.get('/sessions', (_req, res) => {
  try {
    const rows = db.prepare('SELECT id, date FROM sessions ORDER BY date DESC').all() as { id: string; date: string }[];
    const sessions: SessionRecord[] = rows.map((s) => {
      const rounds = db
        .prepare('SELECT round, prep_time AS prepTime, dive_time AS diveTime FROM rounds WHERE session_id = ? ORDER BY round')
        .all(s.id) as RoundRecord[];
      return { id: s.id, date: s.date, rounds };
    });
    res.json({ sessions });
  } catch (e) {
    console.error('GET /api/sessions', e);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

router.post('/sessions', (req, res) => {
  const { rounds } = req.body as { rounds?: RoundRecord[] };
  if (!Array.isArray(rounds) || rounds.length === 0) {
    res.status(400).json({ error: 'rounds array required and must not be empty' });
    return;
  }
  const id = Date.now().toString();
  const date = new Date().toISOString();
  try {
    db.transaction(() => {
      db.prepare('INSERT INTO sessions (id, date) VALUES (?, ?)').run(id, date);
      const stmt = db.prepare('INSERT INTO rounds (session_id, round, prep_time, dive_time) VALUES (?, ?, ?, ?)');
      for (const r of rounds) {
        stmt.run(id, r.round, r.prepTime, r.diveTime);
      }
    })();
    const session: SessionRecord = { id, date, rounds };
    res.status(201).json({ session });
  } catch (e) {
    console.error('POST /api/sessions', e);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

router.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'Session id required' });
    return;
  }
  try {
    db.prepare('DELETE FROM rounds WHERE session_id = ?').run(id);
    const info = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    if (info.changes === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /api/sessions/:id', e);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
