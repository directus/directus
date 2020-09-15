import express, { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { RouteNotFoundException } from '../exceptions';
import ExtensionsService from '../services/extensions';
import env from '../env';

const router = Router();

const extensionsPath = env.EXTENSIONS_PATH as string;
router.use(express.static(extensionsPath));

router.get(
	'/:type',
	asyncHandler(async (req, res, next) => {
		const service = new ExtensionsService();
		const typeAllowList = ['interfaces', 'layouts', 'displays', 'modules'];

		if (typeAllowList.includes(req.params.type) === false) {
			throw new RouteNotFoundException(req.path);
		}

		const extensions = await service.listExtensions(req.params.type);

		res.locals.payload = {
			data: extensions,
		};

		return next();
	})
);

export default router;
