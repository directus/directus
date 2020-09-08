import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import * as ExtensionsService from '../services/extensions';
import { RouteNotFoundException } from '../exceptions';

const router = Router();

router.get(
	'/:type',
	asyncHandler(async (req, res, next) => {
		const typeAllowList = ['interfaces', 'layouts', 'displays', 'modules'];

		if (typeAllowList.includes(req.params.type) === false) {
			throw new RouteNotFoundException(req.path);
		}

		const interfaces = await ExtensionsService.listExtensions(req.params.type);

		res.locals.payload = {
			data: interfaces,
		};

		return next();
	}),
);

export default router;
