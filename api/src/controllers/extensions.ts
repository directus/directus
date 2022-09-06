import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { RouteNotFoundException } from '../exceptions';
import { getExtensionManager } from '../extensions';
import { respond } from '../middleware/respond';
import { depluralize, isIn } from '@directus/shared/utils';
import type { Plural } from '@directus/shared/types';
import { APP_OR_HYBRID_EXTENSION_TYPES } from '@directus/shared/constants';
import ms from 'ms';
import env from '../env';
import { getCacheControlHeader } from '../utils/get-cache-headers';

const router = Router();

router.get(
	'/:type',
	asyncHandler(async (req, res, next) => {
		const type = depluralize(req.params['type'] as Plural<string>);

		if (!isIn(type, APP_OR_HYBRID_EXTENSION_TYPES)) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionManager = getExtensionManager();

		const extensions = extensionManager.getExtensionsList(type);

		res.locals['payload'] = {
			data: extensions,
		};

		return next();
	}),
	respond
);

router.get(
	'/:type/index.js',
	asyncHandler(async (req, res) => {
		const type = depluralize(req.params['type'] as Plural<string>);

		if (!isIn(type, APP_OR_HYBRID_EXTENSION_TYPES)) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionManager = getExtensionManager();

		const extensionSource = extensionManager.getAppExtensions(type);
		if (extensionSource === undefined) {
			throw new RouteNotFoundException(req.path);
		}

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
		if (env['EXTENSIONS_CACHE_TTL']) {
			res.setHeader('Cache-Control', getCacheControlHeader(req, ms(env['EXTENSIONS_CACHE_TTL'])));
		} else {
			res.setHeader('Cache-Control', 'no-store');
		}
		res.setHeader('Vary', 'Origin, Cache-Control');
		res.end(extensionSource);
	})
);

export default router;
