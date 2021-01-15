import { Router } from 'express';
import { ServerService } from '../services';
import { SpecificationService } from '../services';
import asyncHandler from '../utils/async-handler';
import { respond } from '../middleware/respond';

const router = Router();

router.get(
	'/specs/oas',
	asyncHandler(async (req, res, next) => {
		const service = new SpecificationService({
			accountability: req.accountability,
			schema: req.schema,
		});
		res.locals.payload = await service.oas.generate();
		return next();
	}),
	respond
);

router.get('/ping', (req, res) => res.send('pong'));

router.get(
	'/info',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const data = await service.serverInfo();
		res.locals.payload = { data };
		return next();
	}),
	respond
);

router.get(
	'/health',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const data = await service.health();

		res.setHeader('Content-Type', 'application/health+json');

		if (data.status === 'error') res.status(503);
		res.locals.payload = data;
		res.locals.cache = false;
		return next();
	}),
	respond
);

export default router;
