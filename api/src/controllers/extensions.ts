import { useEnv } from '@directus/env';
import { ErrorCode, ForbiddenError, RouteNotFoundError, isDirectusError } from '@directus/errors';
import { EXTENSION_TYPES } from '@directus/extensions';
import {
	account,
	describe,
	list,
	type AccountOptions,
	type DescribeOptions,
	type ListOptions,
	type ListQuery,
} from '@directus/extensions-registry';
import { isIn } from '@directus/utils';
import express from 'express';
import { UUID_REGEX } from '../constants.js';
import { getExtensionManager } from '../extensions/index.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { ExtensionReadError, ExtensionsService } from '../services/extensions.js';
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

router.get(
	'/registry',
	asyncHandler(async (req, res, next) => {
		const { search, limit, offset, type, by } = req.query;

		const query: ListQuery = {};

		if (typeof search === 'string') {
			query.search = search;
		}

		if (typeof limit === 'string') {
			query.limit = Number(limit);
		}

		if (typeof offset === 'string') {
			query.offset = Number(offset);
		}

		if (typeof by === 'string') {
			query.by = by;
		}

		if (typeof type === 'string') {
			if (isIn(type, EXTENSION_TYPES) === false) {
				throw new ForbiddenError();
			}

			query.type = type;
		}

		const options: ListOptions = {};

		if (env['MARKETPLACE_REGISTRY'] && typeof env['MARKETPLACE_REGISTRY'] === 'string') {
			options.registry = env['MARKETPLACE_REGISTRY'];
		}

		const payload = await list(query, options);

		res.locals['payload'] = payload;
		return next();
	}),
	respond,
);

router.get(
	`/registry/account/:pk(${UUID_REGEX})`,
	asyncHandler(async (req, res, next) => {
		if (typeof req.params['pk'] !== 'string') {
			throw new ForbiddenError();
		}

		const options: AccountOptions = {};

		if (env['MARKETPLACE_REGISTRY'] && typeof env['MARKETPLACE_REGISTRY'] === 'string') {
			options.registry = env['MARKETPLACE_REGISTRY'];
		}

		const payload = await account(req.params['pk'], options);

		res.locals['payload'] = payload;
		return next();
	}),
	respond,
);

router.get(
	`/registry/extension/:pk(${UUID_REGEX})`,
	asyncHandler(async (req, res, next) => {
		if (typeof req.params['pk'] !== 'string') {
			throw new ForbiddenError();
		}

		const options: DescribeOptions = {};

		if (env['MARKETPLACE_REGISTRY'] && typeof env['MARKETPLACE_REGISTRY'] === 'string') {
			options.registry = env['MARKETPLACE_REGISTRY'];
		}

		const payload = await describe(req.params['pk'], options);

		res.locals['payload'] = payload;
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

		try {
			const result = await service.updateOne(bundle, name, req.body);
			res.locals['payload'] = { data: result || null };
		} catch (error) {
			let finalError = error;

			if (error instanceof ExtensionReadError) {
				finalError = error.originalError;

				if (isDirectusError(finalError, ErrorCode.Forbidden)) {
					return next();
				}
			}

			throw finalError;
		}

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
