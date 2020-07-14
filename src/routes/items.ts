import express from 'express';
import asyncHandler from 'express-async-handler';
import * as ItemsService from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import collectionExists from '../middleware/collection-exists';
import * as MetaService from '../services/meta';
import * as PermissionsService from '../services/permissions';
import { RouteNotFoundException } from '../exceptions';
import getASTFromQuery from '../utils/get-ast-from-query';

const router = express.Router();

router.post(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.single) {
			throw new RouteNotFoundException(req.path);
		}

		const primaryKey = await ItemsService.createItem(req.collection, req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const item = await ItemsService.readItem(req.collection, primaryKey, req.sanitizedQuery);

		res.json({ data: item || null });
	})
);

router.get(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		let ast = await getASTFromQuery(req.role, req.collection, req.sanitizedQuery);

		console.log(JSON.stringify(ast, null, 2));

		ast = await PermissionsService.processAST(req.role, ast);

		const [records, meta] = await Promise.all([
			req.single
				? ItemsService.readSingleton(req.collection, ast)
				: ItemsService.readItems(req.collection, ast),
			MetaService.getMetaForQuery(req.collection, req.sanitizedQuery),
		]);

		return res.json({
			meta: meta,
			data: records || null,
		});
	})
);

router.get(
	'/:collection/:pk',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.single) {
			throw new RouteNotFoundException(req.path);
		}

		const record = await ItemsService.readItem(
			req.collection,
			req.params.pk,
			req.sanitizedQuery
		);

		return res.json({
			data: record || null,
		});
	})
);

router.patch(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.single === false) {
			throw new RouteNotFoundException(req.path);
		}

		await ItemsService.upsertSingleton(req.collection, req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		// const item = await ItemsService.readSingleton(req.collection, req.sanitizedQuery);

		// return res.json({ data: item || null });
	})
);

router.patch(
	'/:collection/:pk',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.single) {
			throw new RouteNotFoundException(req.path);
		}

		const primaryKey = await ItemsService.updateItem(req.collection, req.params.pk, req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const item = await ItemsService.readItem(req.collection, primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.delete(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res) => {
		await ItemsService.deleteItem(req.collection, req.params.pk, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
