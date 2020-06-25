import express from 'express';
import asyncHandler from 'express-async-handler';
import { createItem, readItems, readItem, updateItem, deleteItem } from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import validateCollection from '../middleware/validate-collection';
import validateSingleton from '../middleware/validate-singleton';
import validateQuery from '../middleware/validate-query';
import * as MetaService from '../services/meta';
import * as PayloadService from '../services/payload';

const router = express.Router();

router.post(
	'/:collection',
	validateCollection,
	validateSingleton,
	asyncHandler(async (req, res) => {
		const payload = await PayloadService.processValues('create', req.collection, req.body);
		await createItem(req.params.collection, payload);
		res.status(200).end();
	})
);

router.get(
	'/:collection',
	validateCollection,
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
	validateCollection,
	asyncHandler(async (req, res) => {
		const record = await readItem(req.params.collection, req.params.pk);

		return res.json({
			data: record,
		});
	})
);

router.patch(
	'/:collection/:pk',
	validateCollection,
	asyncHandler(async (req, res) => {
		const payload = await PayloadService.processValues('update', req.collection, req.body);
		await updateItem(req.params.collection, req.params.pk, payload);
		return res.status(200).end();
	})
);

router.delete(
	'/:collection/:pk',
	validateCollection,
	asyncHandler(async (req, res) => {
		await deleteItem(req.params.collection, req.params.pk);
		return res.status(200).end();
	})
);

export default router;
