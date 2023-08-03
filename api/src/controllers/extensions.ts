import { Router } from 'express';
import env from '../env.js';
import { ErrorCode, ForbiddenError, RouteNotFoundError } from '../errors/index.js';
import { getExtensionManager } from '../extensions/extensions.js';
import { respond } from '../middleware/respond.js';
import asyncHandler from '../utils/async-handler.js';
import { getCacheControlHeader } from '../utils/get-cache-headers.js';
import type { Plural, PrimaryKey } from '@directus/types';
import { ExtensionsService } from '../extensions/service.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { isDirectusError } from '@directus/errors';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.admin !== true) throw new RouteNotFoundError({ path: req.path });

		const extensionManager = await getExtensionManager();

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
		if (req.accountability?.admin !== true) throw new RouteNotFoundError({ path: req.path });

		const name = req.params['name'];

		const extensionManager = await getExtensionManager();

		const extension = extensionManager.getDisplayExtension(name);

		res.locals['payload'] = {
			data: extension,
		};

		return next();
	}),
	respond
);

router.patch(
	'/',
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.admin !== true) throw new RouteNotFoundError({ path: req.path });

		const extensionManager = await getExtensionManager();

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

			res.locals['payload'] = {
				data: extensionManager.getDisplayExtensions().filter((extension) => keys.includes(extension.name)),
			};
		} catch (error: any) {
			if (error instanceof ForbiddenError) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.patch(
	'/:name',
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.admin !== true) throw new RouteNotFoundError({ path: req.path });

		const service = new ExtensionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const name = await service.updateOne(req.params['name']!, req.body);

		const extensionManager = await getExtensionManager();

		try {
			await extensionManager.reload();

			res.locals['payload'] = {
				data: extensionManager.getDisplayExtensions().filter((extension) => extension.name === name),
			};
		} catch (error: any) {
			if (error instanceof ForbiddenError) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.get(
	'/sources/:chunk',
	asyncHandler(async (req, res) => {
		const chunk = req.params['chunk'] as string;
		const extensionManager = await getExtensionManager();

		let source: string | null;

		if (chunk === 'index.js') {
			source = extensionManager.getAppExtensions();
		} else {
			source = extensionManager.registration.getAppExtensionChunk(chunk);
		}

		if (source === null) {
			throw new RouteNotFoundError({ path: req.path });
		}

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');

		res.setHeader(
			'Cache-Control',
			getCacheControlHeader(req, getMilliseconds(env['EXTENSIONS_CACHE_TTL']), false, false)
		);

		res.setHeader('Vary', 'Origin, Cache-Control');
		res.end(source);
	})
);

export default router;
