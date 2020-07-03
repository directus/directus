import express from 'express';
import asyncHandler from 'express-async-handler';
import { createItem, readItems, readItem, updateItem, deleteItem } from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import validateCollection from '../middleware/validate-collection';
import validateSingleton from '../middleware/validate-singleton';
import validateQuery from '../middleware/validate-query';
import * as MetaService from '../services/meta';
import * as PayloadService from '../services/payload';
import * as ActivityService from '../services/activity';

const router = express.Router();

router.post(
	'/:collection',
	validateCollection,
	validateSingleton,
	asyncHandler(async (req, res) => {
		const payload = await PayloadService.processValues('create', req.collection, req.body);
		const item = await createItem(req.params.collection, payload);

		ActivityService.createActivity({
			action: ActivityService.Action.CREATE,
			collection: req.collection,
			/** @TODO don't forget to use real primary key here */
			item: item.id,
			ip: req.ip,
			user_agent: req.get('user-agent'),
			action_by: req.user,
		});

		res.json({ data: item });
	})
);

router.get(
	'/:collection',
	validateCollection,
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const [records, meta] = await Promise.all([
			readItems(req.params.collection, req.sanitizedQuery),
			MetaService.getMetaForQuery(req.params.collection, req.sanitizedQuery),
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
		const item = await updateItem(req.params.collection, req.params.pk, payload);

		ActivityService.createActivity({
			action: ActivityService.Action.UPDATE,
			collection: req.collection,
			item: item.id,
			ip: req.ip,
			user_agent: req.get('user-agent'),
			action_by: req.user,
		});

		return res.json({ data: item });
	})
);

router.delete(
	'/:collection/:pk',
	validateCollection,
	asyncHandler(async (req, res) => {
		await deleteItem(req.params.collection, req.params.pk);

		ActivityService.createActivity({
			action: ActivityService.Action.DELETE,
			collection: req.collection,
			item: req.params.pk,
			ip: req.ip,
			user_agent: req.get('user-agent'),
			action_by: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
