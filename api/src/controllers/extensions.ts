import { ForbiddenError, RouteNotFoundError } from '@directus/errors';
import express from 'express';
import { useEnv } from '../env.js';
import { getExtensionManager } from '../extensions/index.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { ExtensionsService } from '../services/extensions.js';
import asyncHandler from '../utils/async-handler.js';
import { getCacheControlHeader } from '../utils/get-cache-headers.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';

const router = express.Router();
const env = useEnv();

router.use(useCollection('directus_extensions'));

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new ExtensionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const extensions = await service.readAll();
		res.locals['payload'] = { data: extensions || null };
		return next();
	}),
	respond,
);

router.patch(
	'/:bundleOrName/:name?',
	asyncHandler(async (req, res, next) => {
		const service = new ExtensionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const bundle = req.params['name'] ? req.params['bundleOrName'] : null;
		const name = req.params['name'] ? req.params['name'] : req.params['bundleOrName'];

		if (bundle === undefined || !name) {
			throw new ForbiddenError();
		}

		await service.updateOne(bundle, name, req.body);

		const updated = await service.readOne(bundle, name);

		res.locals['payload'] = { data: updated || null };

		return next();
	}),
	respond,
);

router.get(
	'/sources/:chunk',
	asyncHandler(async (req, res) => {
		const chunk = req.params['chunk'] as string;
		const extensionManager = getExtensionManager();

		let source: string | null;

		if (chunk === 'index.js') {
			source = extensionManager.getAppExtensionsBundle();
		} else {
			source = extensionManager.getAppExtensionChunk(chunk);
		}

		if (source === null) {
			throw new RouteNotFoundError({ path: req.path });
		}

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');

		res.setHeader(
			'Cache-Control',
			getCacheControlHeader(req, getMilliseconds(env['EXTENSIONS_CACHE_TTL']), false, false),
		);

		res.setHeader('Vary', 'Origin, Cache-Control');
		res.end(source);
	}),
);

export default router;
