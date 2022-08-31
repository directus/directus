import { Action } from '@directus/shared/types';
import express from 'express';
import Joi from 'joi';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { respond } from '../middleware/respond';
import useCollection from '../middleware/use-collection';
import { validateBatch } from '../middleware/validate-batch';
import { ActivityService, MetaService } from '../services';
import asyncHandler from '../utils/async-handler';
import { getIPFromReq } from '../utils/get-ip-from-req';

const router = express.Router();

router.use(useCollection('directus_activity'));

const readHandler = asyncHandler(async (req, res, next) => {
	const service = new ActivityService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	let result;

	if (req.singleton) {
		result = await service.readSingleton(req.sanitizedQuery);
	} else if (req.body.keys) {
		result = await service.readMany(req.body.keys, req.sanitizedQuery);
	} else {
		result = await service.readByQuery(req.sanitizedQuery);
	}

	const meta = await metaService.getMetaForQuery('directus_activity', req.sanitizedQuery);

	res.locals.payload = {
		data: result,
		meta,
	};

	return next();
});

router.search('/', validateBatch('read'), readHandler, respond);
router.get('/', readHandler, respond);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const record = await service.readOne(req.params.pk, req.sanitizedQuery);

		res.locals.payload = {
			data: record || null,
		};

		return next();
	}),
	respond
);

const createCommentSchema = Joi.object({
	comment: Joi.string().required(),
	collection: Joi.string().required(),
	item: [Joi.number().required(), Joi.string().required()],
});

router.post(
	'/comment',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const { error } = createCommentSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		const primaryKey = await service.createOne({
			...req.body,
			action: Action.COMMENT,
			user: req.accountability?.user,
			ip: getIPFromReq(req),
			user_agent: req.get('user-agent'),
			origin: req.get('origin'),
		});

		try {
			const record = await service.readOne(primaryKey, req.sanitizedQuery);

			res.locals.payload = {
				data: record || null,
			};
		} catch (error: any) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

const updateCommentSchema = Joi.object({
	comment: Joi.string().required(),
});

router.patch(
	'/comment/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const { error } = updateCommentSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		const primaryKey = await service.updateOne(req.params.pk, req.body);

		try {
			const record = await service.readOne(primaryKey, req.sanitizedQuery);

			res.locals.payload = {
				data: record || null,
			};
		} catch (error: any) {
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
	'/comment/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const adminService = new ActivityService({
			schema: req.schema,
		});

		const item = await adminService.readOne(req.params.pk, { fields: ['action'] });

		if (!item || item.action !== 'comment') {
			throw new ForbiddenException();
		}

		await service.deleteOne(req.params.pk);

		return next();
	}),
	respond
);

export default router;
