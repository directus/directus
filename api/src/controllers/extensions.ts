import { Router } from 'express';
import env from '../env';
import { ForbiddenException, RouteNotFoundException } from '../exceptions';
import { getExtensionManager } from '../extensions/extensions';
import { respond } from '../middleware/respond';
import asyncHandler from '../utils/async-handler';
import { getCacheControlHeader } from '../utils/get-cache-headers';
import { PrimaryKey } from '@directus/shared/types';
import { ExtensionsService } from '../extensions/service';
import { getMilliseconds } from '../utils/get-milliseconds';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const extensionManager = getExtensionManager();

		const extensions = extensionManager.getDisplayExtensions();

		res.locals['payload'] = {
			data: extensions,
		};

		return next();
	}),
	respond
);

router.get(
	'/:name',
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.admin !== true) throw new RouteNotFoundException(req.path);

		const name = req.params.name;

		const extensionManager = getExtensionManager();

		const extension = extensionManager.getDisplayExtension(name);

		res.locals.payload = {
			data: extension,
		};

		return next();
	}),
	respond
);

router.patch(
	'/',
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.admin !== true) throw new RouteNotFoundException(req.path);

		const extensionManager = getExtensionManager();

		let keys: PrimaryKey[] = [];

		const service = new ExtensionsService({ accountability: req.accountability, schema: req.schema });

		if (Array.isArray(req.body)) {
			keys = await service.updateBatch(req.body);
		} else if (req.body.keys) {
			keys = await service.updateMany(req.body.keys, req.body.data);
		} else {
			keys = await service.updateByQuery(req.body.query, req.body.data);
		}

		try {
			await extensionManager.reload();

			res.locals.payload = {
				data: extensionManager.getDisplayExtensions().filter((extension) => keys.includes(extension.name)),
			};
		} catch (error: any) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.get(
	'/sources/index.js',
	asyncHandler(async (req, res) => {
		const extensionManager = getExtensionManager();

		const extensionSource = extensionManager.getAppExtensions();
		if (extensionSource === null) {
			throw new RouteNotFoundException(req.path);
		}

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
		res.setHeader(
			'Cache-Control',
			getCacheControlHeader(req, getMilliseconds(env['EXTENSIONS_CACHE_TTL']), false, false)
		);
		res.setHeader('Vary', 'Origin, Cache-Control');
		res.end(extensionSource);
	})
);

export default router;
