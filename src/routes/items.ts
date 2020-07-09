import express from 'express';
import asyncHandler from 'express-async-handler';
import * as ItemsService from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import validateCollection from '../middleware/validate-collection';
import validateSingleton from '../middleware/validate-singleton';
import validateQuery from '../middleware/validate-query';
import * as MetaService from '../services/meta';

const router = express.Router();

router.post(
	'/:collection',
	validateCollection,
	validateSingleton,
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
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
	validateCollection,
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const [records, meta] = await Promise.all([
			ItemsService.readItems(req.collection, req.sanitizedQuery),
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
	validateCollection,
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
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
	'/:collection/:pk',
	validateCollection,
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
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
	validateCollection,
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
