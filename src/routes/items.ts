import express from 'express';
import asyncHandler from 'express-async-handler';
import * as ItemsService from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import validateCollection from '../middleware/validate-collection';
import validateSingleton from '../middleware/validate-singleton';
import validateQuery from '../middleware/validate-query';
import * as MetaService from '../services/meta';
import * as ActivityService from '../services/activity';

const router = express.Router();

router.post(
	'/:collection',
	validateCollection,
	validateSingleton,
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await ItemsService.createItem(req.collection, req.body);
		const item = await ItemsService.readItem(req.collection, primaryKey, req.sanitizedQuery);

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
			ItemsService.readItems(req.collection, req.sanitizedQuery),
			MetaService.getMetaForQuery(req.collection, req.sanitizedQuery),
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
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await ItemsService.readItem(
			req.collection,
			req.params.pk,
			req.sanitizedQuery
		);

		return res.json({
			data: record,
		});
	})
);

router.patch(
	'/:collection/:pk',
	validateCollection,
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await ItemsService.updateItem(req.collection, req.params.pk, req.body);
		const item = await ItemsService.readItem(req.collection, primaryKey, req.sanitizedQuery);

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
		await ItemsService.deleteItem(req.collection, req.params.pk);

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
