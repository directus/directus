import express from 'express';
import env from '../env.js';
import { RouteNotFoundError } from '../errors/index.js';
import { getExtensionManager } from '../extensions/index.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { ExtensionsService } from '../services/extensions.js';
import asyncHandler from '../utils/async-handler.js';
import { getCacheControlHeader } from '../utils/get-cache-headers.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';

const router = express.Router();

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
	respond
);

// router.get(
// 	'/:pk',
// 	asyncHandler(async (req, res, next) => {
// 		const service = new ExtensionsService({
// 			accountability: req.accountability,
// 			schema: req.schema,
// 		});

// 		const record = await service.readOne(req.params['pk']!, req.sanitizedQuery);

// 		res.locals['payload'] = { data: record || null };
// 		return next();
// 	}),
// 	respond
// );

// router.patch(
// 	'/',
// 	validateBatch('update'),
// 	asyncHandler(async (req, res, next) => {
// 		const service = new ExtensionsService({
// 			accountability: req.accountability,
// 			schema: req.schema,
// 		});

// 		let keys: PrimaryKey[] = [];

// 		if (Array.isArray(req.body)) {
// 			keys = await service.updateBatch(req.body);
// 		} else if (req.body.keys) {
// 			keys = await service.updateMany(req.body.keys, req.body.data);
// 		} else {
// 			const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
// 			keys = await service.updateByQuery(sanitizedQuery, req.body.data);
// 		}

// 		try {
// 			const result = await service.readMany(keys, req.sanitizedQuery);
// 			res.locals['payload'] = { data: result };
// 		} catch (error: any) {
// 			if (isDirectusError(error, ErrorCode.Forbidden)) {
// 				return next();
// 			}

// 			throw error;
// 		}

// 		return next();
// 	}),
// 	respond
// );

// router.patch(
// 	'/:pk',
// 	asyncHandler(async (req, res, next) => {
// 		const service = new ExtensionsService({
// 			accountability: req.accountability,
// 			schema: req.schema,
// 		});

// 		const primaryKey = await service.updateOne(req.params['pk']!, req.body);

// 		try {
// 			const record = await service.readOne(primaryKey, req.sanitizedQuery);
// 			res.locals['payload'] = { data: record };
// 		} catch (error: any) {
// 			if (isDirectusError(error, ErrorCode.Forbidden)) {
// 				return next();
// 			}

// 			throw error;
// 		}

// 		return next();
// 	}),
// 	respond
// );

// export default router;

// // const router = Router();

// // router.get(
// // 	'/:type?',
// // 	asyncHandler(async (req, res, next) => {
// // 		let type: (typeof EXTENSION_TYPES)[number] | undefined = undefined;

// // 		if (req.params['type']) {
// // 			const singularType = depluralize(req.params['type'] as Plural<string>);

// // 			if (!isIn(singularType, EXTENSION_TYPES)) {
// // 				throw new RouteNotFoundError({ path: req.path });
// // 			}

// // 			type = singularType;
// // 		}

// // 		const extensionManager = getExtensionManager();

// // 		const extensions = extensionManager.getExtensions(type);

// // 		res.locals['payload'] = {
// // 			data: extensions,
// // 		};

// // 		return next();
// // 	}),
// // 	respond
// // );

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
			getCacheControlHeader(req, getMilliseconds(env['EXTENSIONS_CACHE_TTL']), false, false)
		);

		res.setHeader('Vary', 'Origin, Cache-Control');
		res.end(source);
	})
);

export default router;
