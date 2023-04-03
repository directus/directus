import express from 'express';
import { ForbiddenException, RouteNotFoundException } from '../exceptions';
import { respond } from '../middleware/respond';
import { validateBatch } from '../middleware/validate-batch';
import { ItemsService, MetaService } from '../services';
import type { PrimaryKey } from '../types';
import asyncHandler from '../utils/async-handler';
import { sanitizeQuery } from '../utils/sanitize-query';

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

		if (Array.isArray(req.body)) {
			const keys = await service.createMany(req.body);
			savedKeys.push(...keys);
		} else {
			const key = await service.createOne(req.body);
			savedKeys.push(key);
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

router.patch(
	'/:language/:key',
	asyncHandler(async (req, res, next) => {
		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService('directus_translation_strings', {
			accountability: req.accountability,
			schema: req.schema,
		});

		const updatedPrimaryKey = await service.updateByQuery(
			{
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
			},
			req.body
		);

		try {
			const result = await service.readMany(updatedPrimaryKey, req.sanitizedQuery);
			res.locals['payload'] = { data: result || null };
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
