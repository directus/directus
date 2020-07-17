import express from 'express';
import asyncHandler from 'express-async-handler';
import * as ItemsService from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import collectionExists from '../middleware/collection-exists';
import * as MetaService from '../services/meta';
import { RouteNotFoundException } from '../exceptions';

const router = express.Router();

router.post(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.single) {
			throw new RouteNotFoundException(req.path);
		}

		if (Array.isArray(req.body)) {
			const items = await Promise.all(req.body.map(createItem));
			res.json({ data: items || null });
		} else {
			const item = await createItem(req.body);
			res.json({ data: item || null });
		}

		async function createItem(body: Record<string, any>) {
			const primaryKey = await ItemsService.createItem(req.collection, body, {
				user: req.user,
				role: req.role,
				admin: req.admin,
				ip: req.ip,
				userAgent: req.get('user-agent'),
			});

			const item = await ItemsService.readItem(
				req.collection,
				primaryKey,
				req.sanitizedQuery,
				{
					role: req.role,
					admin: req.admin,
				}
			);

			return item;
		}
	})
);

router.get(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const [records, meta] = await Promise.all([
			req.single
				? ItemsService.readSingleton(req.collection, req.sanitizedQuery, {
						role: req.role,
						admin: req.admin,
				  })
				: ItemsService.readItems(req.collection, req.sanitizedQuery, {
						role: req.role,
						admin: req.admin,
				  }),
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
			req.sanitizedQuery,
			{ role: req.role, admin: req.admin }
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
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const item = await ItemsService.readSingleton(req.collection, req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});

		return res.json({ data: item || null });
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

		const primaryKey = req.params.pk;

		const isBatch = primaryKey.includes(',');

		if (isBatch) {
			const primaryKeys = primaryKey.split(',');
			const items = await Promise.all(primaryKeys.map(updateItem));
			return res.json({ data: items || null });
		} else {
			const item = await updateItem(primaryKey);
			return res.json({ data: item || null });
		}

		async function updateItem(pk: string | number) {
			const primaryKey = await ItemsService.updateItem(req.collection, pk, req.body, {
				role: req.role,
				admin: req.admin,
				ip: req.ip,
				userAgent: req.get('user-agent'),
				user: req.user,
			});

			const item = await ItemsService.readItem(
				req.collection,
				primaryKey,
				req.sanitizedQuery,
				{
					role: req.role,
					admin: req.admin,
				}
			);

			return item;
		}
	})
);

router.delete(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res) => {
		const primaryKey = req.params.pk;

		const isBatch = primaryKey.includes(',');

		if (isBatch) {
			const primaryKeys = primaryKey.split(',');
			await Promise.all(primaryKeys.map(deleteItem));
		} else {
			await deleteItem(primaryKey);
		}

		return res.status(200).end();

		async function deleteItem(pk: string | number) {
			await ItemsService.deleteItem(req.collection, pk, {
				role: req.role,
				admin: req.admin,
				ip: req.ip,
				userAgent: req.get('user-agent'),
				user: req.user,
			});
		}
	})
);

export default router;
