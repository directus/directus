import { Router } from 'express';
import { ServerService } from '../services';
import { respond } from '../middleware/respond';

const router = Router();

router.get('/ping', (req, res) => res.send('pong'));

router.get(
	'/info',
	(req, res, next) => {
		const service = new ServerService({ accountability: req.accountability });
		const data = service.serverInfo();
		res.locals.payload = data;
		return next();
	},
	respond
);

export default router;
