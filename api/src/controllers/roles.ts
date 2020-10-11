import express from 'express';
import asyncHandler from 'express-async-handler';
import { RolesService, MetaService } from '../services';
import { ForbiddenException } from '../exceptions';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';

const router = express.Router();

router.use(useCollection('directus_roles'));

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new RolesService({ accountability: req.accountability });
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
	}),
	respond
);

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new RolesService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_roles', req.sanitizedQuery);

		res.locals.payload = { data: records || null, meta };
		return next();
	}),
	respond
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new RolesService({ accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const record = await service.readByKey(pk as any, req.sanitizedQuery);
		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new RolesService({ accountability: req.accountability });
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
	}),
	respond
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new RolesService({ accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		await service.delete(pk as any);
		return next();
	}),
	respond
);

export default router;
