import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { RouteNotFoundException } from '../exceptions';
import { listExtensions, getAppExtensionSource } from '../extensions';
import { respond } from '../middleware/respond';
import { depluralize } from '@directus/shared/utils';
import { AppExtensionType, Plural } from '@directus/shared/types';
import { APP_EXTENSION_TYPES } from '@directus/shared/constants';

const router = Router();

router.get(
	'/:type',
	asyncHandler(async (req, res, next) => {
		const type = depluralize(req.params.type as Plural<AppExtensionType>);

		if (APP_EXTENSION_TYPES.includes(type) === false) {
			throw new RouteNotFoundException(req.path);
		}

		const extensions = listExtensions(type);

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
		const type = depluralize(req.params.type as Plural<AppExtensionType>);

		if (APP_EXTENSION_TYPES.includes(type) === false) {
			throw new RouteNotFoundException(req.path);
		}

		const extensionSource = getAppExtensionSource(type);
		if (extensionSource === undefined) {
			throw new RouteNotFoundException(req.path);
		}

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
		res.end(extensionSource);
	})
);

export default router;
