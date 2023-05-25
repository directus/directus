import express from 'express';
import { ForbiddenException } from '../exceptions/index.js';
import { respond } from '../middleware/respond.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { TranslationsService } from '../services/index.js';
import asyncHandler from '../utils/async-handler.js';
import type { PrimaryKey } from '@directus/types';

const router = express.Router();

const readHandler = asyncHandler(async (req, res, next) => {
	const service = new TranslationsService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const result = await service.readByQuery(req.sanitizedQuery);

	res.locals['payload'] = {
		data: result,
	};

	return next();
});

router.search('/', validateBatch('read'), readHandler, respond);
router.get('/', readHandler, respond);

const upsertHandler = asyncHandler(async (req, res, next) => {
	const service = new TranslationsService({
		accountability: req.accountability,
		schema: req.schema,
	});

	try {
		let savedKeys: PrimaryKey[] = [];

		const existingKeys: PrimaryKey[] = (
			await service.readByQuery({
				fields: ['id'],
				filter: {
					key: { _eq: req.params['key']! },
				},
			})
		).map(({ id }) => id);

		if (Array.isArray(req.body)) {
			savedKeys = await service.upsertMany(req.body);
			const result = await service.readMany(savedKeys, req.sanitizedQuery);
			res.locals['payload'] = { data: result || null };
		} else {
			const savedKey = await service.upsertOne(req.body);
			savedKeys.push(savedKey);
			const result = await service.readOne(savedKey, req.sanitizedQuery);
			res.locals['payload'] = { data: result || null };
		}

		const deleteKeys = existingKeys.filter((id) => !savedKeys.includes(id));
		if (deleteKeys.length > 0) await service.deleteMany(deleteKeys);
	} catch (error: any) {
		if (error instanceof ForbiddenException) {
			return next();
		}

		throw error;
	}

	return next();
});

router.post('/:key', upsertHandler, respond);
router.patch('/:key', upsertHandler, respond);

router.delete(
	'/:key',
	asyncHandler(async (req, _res, next) => {
		const service = new TranslationsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteByQuery({
			filter: {
				key: {
					_eq: req.params['key']!,
				},
			},
		});

		return next();
	}),
	respond
);

export default router;
