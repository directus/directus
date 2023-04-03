import express from 'express';
import { ForbiddenException, RouteNotFoundException } from '../exceptions';
import { respond } from '../middleware/respond';
import { validateBatch } from '../middleware/validate-batch';
import { ItemsService, MetaService } from '../services';
import type { PrimaryKey } from '../types';
import asyncHandler from '../utils/async-handler';
import { sanitizeQuery } from '../utils/sanitize-query';

const router = express.Router();

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

const readHandler = asyncHandler(async (req, res, next) => {
	const service = new ItemsService('directus_translation_strings', {
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	let result;

	if (req.body.keys) {
		result = await service.readMany(req.body.keys, req.sanitizedQuery);
	} else {
		result = await service.readByQuery(req.sanitizedQuery);
	}

	const meta = await metaService.getMetaForQuery('directus_translation_strings', req.sanitizedQuery);

	res.locals['payload'] = {
		meta: meta,
		data: result,
	};

	return next();
});

router.search('/', validateBatch('read'), readHandler, respond);
router.get('/', readHandler, respond);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService('directus_translation_strings', {
			accountability: req.accountability,
			schema: req.schema,
		});

		const result = await service.readOne(req.params['pk']!, req.sanitizedQuery);

		res.locals['payload'] = {
			data: result || null,
		};

		return next();
	}),
	respond
);

router.patch(
	'/:collection',
	validateBatch('update'),
	asyncHandler(async (req, res, next) => {
		const service = new ItemsService('directus_translation_strings', {
			accountability: req.accountability,
			schema: req.schema,
		});

		let keys: PrimaryKey[] = [];

		if (Array.isArray(req.body)) {
			keys = await service.updateBatch(req.body);
		} else if (req.body.keys) {
			keys = await service.updateMany(req.body.keys, req.body.data);
		} else {
			const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
			keys = await service.updateByQuery(sanitizedQuery, req.body.data);
		}

		try {
			const result = await service.readMany(keys, req.sanitizedQuery);
			res.locals['payload'] = { data: result };
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
	'/:pk',
	asyncHandler(async (req, res, next) => {
		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService('directus_translation_strings', {
			accountability: req.accountability,
			schema: req.schema,
		});

		const updatedPrimaryKey = await service.updateOne(req.params['pk']!, req.body);

		try {
			const result = await service.readOne(updatedPrimaryKey, req.sanitizedQuery);
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
	'/:pk',
	asyncHandler(async (req, _res, next) => {
		const service = new ItemsService('directus_translation_strings', {
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params['pk']!);
		return next();
	}),
	respond
);

export default router;
