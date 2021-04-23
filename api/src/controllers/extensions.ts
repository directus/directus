import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { RouteNotFoundException } from '../exceptions';
import { listExtensions, findExtension, readExtensionSource, extensionDirToType } from '../extensions';
import { respond } from '../middleware/respond';
import { AppExtensionType, ExtensionDir } from '../types';

const router = Router();

const appExtensions: ExtensionDir<AppExtensionType>[] = ['interfaces', 'displays', 'layouts', 'modules'];

router.get(
	'/:type',
	asyncHandler(async (req, res, next) => {
		const type = req.params.type as ExtensionDir<AppExtensionType>;

		if (appExtensions.includes(type) === false) {
			throw new RouteNotFoundException(req.path);
		}

		const extensions = listExtensions(extensionDirToType(type));

		res.locals.payload = {
			data: extensions,
		};

		return next();
	}),
	respond
);

router.get(
	'/:type/:name/index.js',
	asyncHandler(async (req, res) => {
		const type = req.params.type as ExtensionDir<AppExtensionType>;

		if (appExtensions.includes(type) === false) {
			throw new RouteNotFoundException(req.path);
		}

		const extension = findExtension(extensionDirToType(type), req.params.name);
		if (extension === undefined) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionSource = await readExtensionSource(extension);

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
		res.end(extensionSource);
	})
);

export default router;
