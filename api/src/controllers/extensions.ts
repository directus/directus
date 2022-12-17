import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { RouteNotFoundException } from '../exceptions';
import { getExtensionManager } from '../extensions';
import { respond } from '../middleware/respond';
import { depluralize, isIn } from '@directus/shared/utils';
import { Plural } from '@directus/shared/types';
import { EXTENSION_TYPES } from '@directus/shared/constants';
import ms from 'ms';
import env from '../env';
import { getCacheControlHeader } from '../utils/get-cache-headers';

const router = Router();

router.get('/', asyncHandler(async (req, res, next) => {

		const extensionManager = getExtensionManager();

		const extensions = extensionManager.getExtensionsList();

		res.locals.payload = {
			data: extensions,
		};

		return next();
	}),
	respond
);

router.get(
	'/:type',
	asyncHandler(async (req, res, next) => {
		const type = depluralize(req.params.type as Plural<string>);

		if (!isIn(type, EXTENSION_TYPES)) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionManager = getExtensionManager();

		const extensions = extensionManager.getExtensionsList(type);

		res.locals.payload = {
			data: extensions,
		};

		return next();
	}),
	respond
);

router.post('/', asyncHandler(async (req, res, next) => {

		const name = req.body.name;
		const version = req.body.version ?? 'latest';

		if(!name) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionManager = getExtensionManager();

		const extension = extensionManager.getExtension(name);

		let result;

		if(!extension) {
			result = await extensionManager.installExtension(name, version);
		}

		result = await extensionManager.updateExtension(name);

		if(!result) {
			throw new RouteNotFoundException(req.path);
		}

		extensionManager.reload();

		return next();
	}),
	respond
);

router.delete('/:name', asyncHandler(async (req, res, next) => {}));

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
			env.EXTENSIONS_CACHE_TTL ? getCacheControlHeader(req, ms(env.EXTENSIONS_CACHE_TTL as string)) : 'no-store'
		);
		res.setHeader('Vary', 'Origin, Cache-Control');
		res.end(extensionSource);
	})
);

export default router;
