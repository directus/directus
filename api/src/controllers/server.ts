import { Router } from 'express';

const router = Router();

router.get('/ping', (req, res) => res.send('pong'));
router.get('/info', (req, res) => res.json({ data: process.versions }));

export default router;
