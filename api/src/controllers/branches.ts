import { isDirectusError } from '@directus/errors';
import express from 'express';
import { assign, pick } from 'lodash-es';
import { ErrorCode } from '../errors/index.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { BranchesService } from '../services/branches.js';
import { MetaService } from '../services/meta.js';
import type { PrimaryKey } from '../types/index.js';
import asyncHandler from '../utils/async-handler.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';
import { ItemsService } from '../services/items.js';

const router = express.Router();

router.use(useCollection('directus_branches'));

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new BranchesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const savedKeys: PrimaryKey[] = [];

		if (Array.isArray(req.body)) {
			const keys = await service.createMany(req.body);
			savedKeys.push(...keys);
		} else {
			const primaryKey = await service.createOne(req.body);
			savedKeys.push(primaryKey);
		}

		try {
			if (Array.isArray(req.body)) {
				const records = await service.readMany(savedKeys, req.sanitizedQuery);
				res.locals['payload'] = { data: records };
			} else {
				const record = await service.readOne(savedKeys[0]!, req.sanitizedQuery);
				res.locals['payload'] = { data: record };
			}
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

const readHandler = asyncHandler(async (req, res, next) => {
	const service = new BranchesService({
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

	const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

	res.locals['payload'] = { data: result, meta };
	return next();
});

router.get('/', validateBatch('read'), readHandler, respond);
router.search('/', validateBatch('read'), readHandler, respond);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new BranchesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const record = await service.readOne(req.params['pk']!, req.sanitizedQuery);

		res.locals['payload'] = { data: record || null };
		return next();
	}),
	respond
);

router.patch(
	'/',
	validateBatch('update'),
	asyncHandler(async (req, res, next) => {
		const service = new BranchesService({
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
			res.locals['payload'] = { data: result || null };
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
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
		const service = new BranchesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const primaryKey = await service.updateOne(req.params['pk']!, req.body);

		try {
			const record = await service.readOne(primaryKey, req.sanitizedQuery);
			res.locals['payload'] = { data: record || null };
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.delete(
	'/',
	validateBatch('delete'),
	asyncHandler(async (req, _res, next) => {
		const service = new BranchesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body)) {
			await service.deleteMany(req.body);
		} else if (req.body.keys) {
			await service.deleteMany(req.body.keys);
		} else {
			const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
			await service.deleteByQuery(sanitizedQuery);
		}

		return next();
	}),
	respond
);

router.delete(
	'/:pk',
	asyncHandler(async (req, _res, next) => {
		const service = new BranchesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params['pk']!);

		return next();
	}),
	respond
);

router.get(
	'/:pk/compare',
	asyncHandler(async (req, res, next) => {
		const service = new BranchesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const branch = await service.readOne(req.params['pk']!);

		const commits = await service.getBranchCommits(branch['id']);

		const current = assign({}, ...commits);

		const fields = Object.keys(current);

		const mainBranchItem = await service.getMainBranchItem(
			branch['collection'],
			branch['item'],
			fields.length > 0 ? { fields } : undefined
		);

		res.locals['payload'] = { data: { current, main: mainBranchItem } };

		return next();
	}),
	respond
);

router.post(
	'/:pk/commit',
	asyncHandler(async (req, res, next) => {
		const service = new BranchesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const branch = await service.readOne(req.params['pk']!);

		const mainBranchItem = await service.getMainBranchItem(branch['collection'], branch['item']);

		await service.commit(req.params['pk']!, req.body);

		const commits = await service.getBranchCommits(req.params['pk']!);

		const result = assign(mainBranchItem, ...commits);

		res.locals['payload'] = { data: result || null };

		return next();
	}),
	respond
);

router.post(
	'/:pk/merge',
	asyncHandler(async (req, res, next) => {
		const service = new BranchesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const branch = await service.readOne(req.params['pk']!);

		const commits = await service.getBranchCommits(branch['id']);

		const branchResult = assign({}, ...commits);

		const payloadToUpdate = req.body?.['fields'] ? pick(branchResult, req.body['fields']) : branchResult;

		// will throw an error if the accountability does not have permission to update the item
		await service.authorizationService.checkAccess('update', branch['collection'], branch['item']);

		const itemsService = new ItemsService(branch['collection'], {
			accountability: req.accountability,
			schema: req.schema,
		});

		const updatedItemKey = await itemsService.updateOne(branch['item'], payloadToUpdate);

		res.locals['payload'] = { data: updatedItemKey || null };

		return next();
	}),
	respond
);

export default router;
