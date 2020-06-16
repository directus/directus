import express from 'express';
import asyncHandler from 'express-async-handler';
import { createItem, readItems, readItem, updateItem, deleteItem } from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';

const router = express.Router();

router.post(
	'/:collection',
	asyncHandler(async (req, res) => {
		await createItem(req.params.collection, req.body);
		res.status(200).end();
	})
);

router.get(
	'/:collection',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const records = await readItems(req.params.collection, res.locals.query);

		return res.json({
			data: records,
		});
	})
);

router.get(
	'/:collection/:pk',
	asyncHandler(async (req, res) => {
		const record = await readItem(req.params.collection, req.params.pk);

		return res.json({
			data: record,
		});
	})
);

router.patch(
	'/:collection/:pk',
	asyncHandler(async (req, res) => {
		await updateItem(req.params.collection, req.params.pk, req.body);
		return res.status(200).end();
	})
);

router.delete(
	'/:collection/:pk',
	asyncHandler(async (req, res) => {
		await deleteItem(req.params.collection, req.params.pk);
		return res.status(200).end();
	})
);

export default router;
