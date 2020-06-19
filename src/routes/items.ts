import express from 'express';
import asyncHandler from 'express-async-handler';
import { createItem, readItems, readItem, updateItem, deleteItem } from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import collectionExists from '../middleware/collection-exists';
import validateQuery from '../middleware/validate-query';
import * as MetaService from '../services/meta';

const router = express.Router();

router.post(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res) => {
		await createItem(req.params.collection, req.body);
		res.status(200).end();
	})
);

router.get(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const [records, meta] = await Promise.all([
			readItems(req.params.collection, res.locals.query),
			MetaService.getMetaForQuery(req.params.collection, res.locals.query),
		]);

		return res.json({
			meta: meta,
			data: records,
		});
	})
);

router.get(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res) => {
		const record = await readItem(req.params.collection, req.params.pk);

		return res.json({
			data: record,
		});
	})
);

router.patch(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res) => {
		await updateItem(req.params.collection, req.params.pk, req.body);
		return res.status(200).end();
	})
);

router.delete(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res) => {
		await deleteItem(req.params.collection, req.params.pk);
		return res.status(200).end();
	})
);

export default router;
