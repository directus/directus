import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { RouteNotFoundException } from '../exceptions';
import { getExtensionManager } from '../extensions';
import ms from 'ms';
import env from '../env';
import { getCacheControlHeader } from '../utils/get-cache-headers';

const router = Router();

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
