import express from 'express';
import asyncHandler from 'express-async-handler';
import PermissionsService from '../services/permissions';
import MetaService from '../services/meta';
import { clone } from 'lodash';
import { InvalidCredentialsException, ForbiddenException } from '../exceptions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_permissions'));

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new PermissionsService({ accountability: req.accountability });
		const primaryKey = await service.create(req.body);

		try {
			const item = await service.readByKey(primaryKey, req.sanitizedQuery);
			res.locals.payload = { data: item || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}
		return next();
	})
);

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new PermissionsService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const item = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_permissions', req.sanitizedQuery);

		res.locals.payload = { data: item || null, meta };
		return next();
	})
);

router.get(
	'/me',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user || !req.accountability?.role) {
			throw new InvalidCredentialsException();
		}

		const service = new PermissionsService();
		const query = clone(req.sanitizedQuery || {});

		query.filter = {
			...(query.filter || {}),
			role: {
				_eq: req.accountability.role,
			},
		};

		const items = await service.readByQuery(req.sanitizedQuery);

		res.locals.payload = { data: items || null };
		return next();
	})
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		if (req.path.endsWith('me')) return next();
		const service = new PermissionsService({ accountability: req.accountability });
		const primaryKey = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const record = await service.readByKey(primaryKey as any, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PermissionsService({ accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const primaryKey = await service.update(req.body, pk as any);

		try {
			const item = await service.readByKey(primaryKey, req.sanitizedQuery);
			res.locals.payload = { data: item || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new PermissionsService({ accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		await service.delete(pk as any);
		return next();
	})
);

export default router;
