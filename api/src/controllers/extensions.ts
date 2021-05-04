import express, { Router } from 'express';
import env from '../env';
import { RouteNotFoundException } from '../exceptions';
import { listExtensions } from '../extensions';
import { respond } from '../middleware/respond';
import asyncHandler from '../utils/async-handler';

const router = Router();

const extensionsPath = env.EXTENSIONS_PATH as string;

const appExtensions = ['interfaces', 'layouts', 'displays', 'modules'];

router.get(
	['/:type', '/:type/*'],
	asyncHandler(async (req, res, next) => {
		if (appExtensions.includes(req.params.type) === false) {
			throw new RouteNotFoundException(req.path);
		}

		return next();
	}),
	express.static(extensionsPath),
	asyncHandler(async (req, res, next) => {
		const extensions = await listExtensions(req.params.type);

		res.locals.payload = {
			data: extensions,
		};

		return next();
	}),
	respond
);

export default router;
