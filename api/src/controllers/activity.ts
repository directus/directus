import { ErrorCode, InvalidPayloadError, isDirectusError } from '@directus/errors';
import express from 'express';
import Joi from 'joi';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { ActivityService } from '../services/activity.js';
import { CommentsService } from '../services/comments.js';
import { MetaService } from '../services/meta.js';
import asyncHandler from '../utils/async-handler.js';

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
	let isComment;

	if (req.singleton) {
		result = await service.readSingleton(req.sanitizedQuery);
	} else if (req.body.keys) {
		result = await service.readMany(req.body.keys, req.sanitizedQuery);
	} else {
		const sanitizedFilter = req.sanitizedQuery.filter;

		if (
			sanitizedFilter &&
			'_and' in sanitizedFilter &&
			Array.isArray(sanitizedFilter['_and']) &&
			sanitizedFilter['_and'].find(
				(andItem) => 'action' in andItem && '_eq' in andItem['action'] && andItem['action']['_eq'] === 'comment',
			)
		) {
			const commentsService = new CommentsService({
				accountability: req.accountability,
				schema: req.schema,
				serviceOrigin: 'activity',
			});

			result = await commentsService.readByQuery(req.sanitizedQuery);
			isComment = true;
		} else {
			result = await service.readByQuery(req.sanitizedQuery);
		}
	}

	const meta = await metaService.getMetaForQuery(
		isComment ? 'directus_comments' : 'directus_activity',
		req.sanitizedQuery,
	);

	res.locals['payload'] = {
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

		const record = await service.readOne(req.params['pk']!, req.sanitizedQuery);

		res.locals['payload'] = {
			data: record || null,
		};

		return next();
	}),
	respond,
);

const createCommentSchema = Joi.object({
	comment: Joi.string().required(),
	collection: Joi.string().required(),
	item: [Joi.number().required(), Joi.string().required()],
});

router.post(
	'/comment',
	asyncHandler(async (req, res, next) => {
		const service = new CommentsService({
			accountability: req.accountability,
			schema: req.schema,
			serviceOrigin: 'activity',
		});

		const { error } = createCommentSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const primaryKey = await service.createOne(req.body);

		try {
			const record = await service.readOne(primaryKey, req.sanitizedQuery);

			res.locals['payload'] = {
				data: record || null,
			};
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond,
);

const updateCommentSchema = Joi.object({
	comment: Joi.string().required(),
});

router.patch(
	'/comment/:pk',
	asyncHandler(async (req, res, next) => {
		const commentsService = new CommentsService({
			accountability: req.accountability,
			schema: req.schema,
			serviceOrigin: 'activity',
		});

		const { error } = updateCommentSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const primaryKey = await commentsService.updateOne(req.params['pk']!, req.body);

		try {
			const record = await commentsService.readOne(primaryKey, req.sanitizedQuery);

			res.locals['payload'] = {
				data: record || null,
			};
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond,
);

router.delete(
	'/comment/:pk',
	asyncHandler(async (req, _res, next) => {
		const commentsService = new CommentsService({
			accountability: req.accountability,
			schema: req.schema,
			serviceOrigin: 'activity',
		});

		await commentsService.deleteOne(req.params['pk']!);

		return next();
	}),
	respond,
);

export default router;
