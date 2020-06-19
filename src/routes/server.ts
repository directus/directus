import { Router } from 'express';

const router = Router();

router.get('/ping', (req, res) => res.send('pong'));

export default router;
