import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { InvalidPayloadException, RouteNotFoundException } from '../exceptions';
import { getExtensionManager } from '../extensions';
import { respond } from '../middleware/respond';
import { depluralize, isAppExtension } from '@directus/shared/utils';
import { Plural } from '@directus/shared/types';

const router = Router();

router.post(
	'/install',
	asyncHandler(async (req, res) => {
		const name = req.body.name;

		if (!name) {
			throw new InvalidPayloadException('No extension name specified');
		}

		const extensionManager = getExtensionManager();

		const installed = await extensionManager.install(name);

		if (!installed) {
			throw new InvalidPayloadException(`Couldn't install extension ${name}`);
		}

		res.end();
	})
);

router.post(
	'/uninstall',
	asyncHandler(async (req, res) => {
		const name = req.body.name;

		if (!name) {
			throw new InvalidPayloadException('No extension name specified');
		}

		const extensionManager = getExtensionManager();

		const uninstalled = await extensionManager.uninstall(name);

		if (!uninstalled) {
			throw new InvalidPayloadException(`Couldn't uninstall extension ${name}`);
		}

		res.end();
	})
);

router.get(
	'/:type',
	asyncHandler(async (req, res, next) => {
		const type = depluralize(req.params.type as Plural<string>);

		if (!isAppExtension(type)) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionManager = getExtensionManager();

		const extensions = extensionManager.listExtensions(type);

		res.locals.payload = {
			data: extensions,
		};

		return next();
	}),
	respond
);

router.get(
	'/:type/index.js',
	asyncHandler(async (req, res) => {
		const type = depluralize(req.params.type as Plural<string>);

		if (!isAppExtension(type)) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionManager = getExtensionManager();

		const extensionSource = extensionManager.getAppExtensions(type);
		if (extensionSource === undefined) {
			throw new RouteNotFoundException(req.path);
		}

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
		res.end(extensionSource);
	})
);

export default router;
