import { Router } from 'express';
import ServerService from '../services/server';

const router = Router();

router.get('/ping', (req, res) => res.send('pong'));

router.get('/info', (req, res) => {
	const service = new ServerService({ accountability: req.accountability });
	const data = service.serverInfo();
	res.json({ data });
});

export default router;
