import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { RouteNotFoundException } from '../exceptions';
import { getExtensionManager } from '../extensions';
import { respond } from '../middleware/respond';
import { depluralize, isAppExtension } from '@directus/shared/utils';
import { Plural } from '@directus/shared/types';
import env from '../env';
import fs from 'fs';
import util from 'util';
import path from 'path';

const router = Router();

router.get(
	'/:type',
	asyncHandler(async (req, res, next) => {
		const type = depluralize(req.params.type as Plural<string>);

		if (!isAppExtension(type)) {
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

//support direct serving of external app extensions during development
if (env.NODE_ENV === 'development') {
	router.get(
		'/app/index.js',
		asyncHandler(async (req, res) => {
			const readFile = util.promisify(fs.readFile);
			const externalExtensionsPath = path.join(env.EXTENSIONS_PATH, 'app', 'index.js');
			const extensionSource = await readFile(externalExtensionsPath, 'utf8');

			res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
			res.setHeader('Cache-Control', 'no-store');
			res.setHeader('Vary', 'Origin, Cache-Control');
			res.end(extensionSource);
		})
	);
}

router.get(
	'/:type/index.js',
	asyncHandler(async (req, res) => {
		const type = req.params.type === 'app' ? 'app' : depluralize(req.params.type as Plural<string>);

		if (!isAppExtension(type)) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionManager = getExtensionManager();

		const extensionSource = extensionManager.getAppExtensions(type);
		if (extensionSource === undefined) {
			throw new RouteNotFoundException(req.path);
		}

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
		res.setHeader('Cache-Control', 'no-store');
		res.setHeader('Vary', 'Origin, Cache-Control');
		res.end(extensionSource);
	})
);

export default router;
