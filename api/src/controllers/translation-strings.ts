import express from 'express';
import { ForbiddenException } from '../exceptions';
import { respond } from '../middleware/respond';
import { validateBatch } from '../middleware/validate-batch';
import { ItemsService, MetaService } from '../services';
import type { Item, PrimaryKey } from '../types';
import asyncHandler from '../utils/async-handler';
import { omit } from 'lodash';
// import { sanitizeQuery } from '../utils/sanitize-query';

const router = express.Router();

const readHandler = asyncHandler(async (req, res, next) => {
	const service = new ItemsService('directus_translation_strings', {
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const result = await service.readByQuery(req.sanitizedQuery);

	const meta = await metaService.getMetaForQuery('directus_translation_strings', req.sanitizedQuery);

	res.locals['payload'] = {
		meta: meta,
		data: result,
	};

	return next();
});

router.search('/', validateBatch('read'), readHandler, respond);
router.get('/', readHandler, respond);

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService('directus_translation_strings', {
			accountability: req.accountability,
			schema: req.schema,
		});

		const savedKeys: PrimaryKey[] = [];
		async function customUpsert(item: Partial<Item>) {
			const result = await service.readByQuery({
				filter: {
					_and: [{ language: { _eq: item['language']! } }, { key: { _eq: item['key']! } }],
				},
				fields: ['*'],
				limit: 1,
			});
			console.log(result);
			if (result) {
				const { id } = result[0]!;
				const key = await service.updateOne(id, omit(item, 'id'));
				savedKeys.push(key);
			} else {
				const key = await service.createOne(item);
				savedKeys.push(key);
			}
		}

		if (Array.isArray(req.body)) {
			for (const item of req.body) {
				await customUpsert(item);
			}
		} else {
			await customUpsert(req.body);
		}

		try {
			if (Array.isArray(req.body)) {
				const result = await service.readMany(savedKeys, req.sanitizedQuery);
				res.locals['payload'] = { data: result || null };
			} else {
				const result = await service.readOne(savedKeys[0]!, req.sanitizedQuery);
				res.locals['payload'] = { data: result || null };
			}
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
	'/:language/:key',
	asyncHandler(async (req, _res, next) => {
		const service = new ItemsService('directus_translation_strings', {
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteByQuery({
			filter: {
				_and: [
					{
						key: {
							_eq: req.params['key']!,
						},
					},
					{ language: { _eq: req.params['language']! } },
				],
			},
		});
		return next();
	}),
	respond
);
router.delete(
	'/:key',
	asyncHandler(async (req, _res, next) => {
		const service = new ItemsService('directus_translation_strings', {
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
