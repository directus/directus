import express from 'express';
import asyncHandler from 'express-async-handler';
import * as ItemsService from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import collectionExists from '../middleware/collection-exists';
import * as MetaService from '../services/meta';
import { RouteNotFoundException } from '../exceptions';
import { Accountability, PrimaryKey } from '../types';

const router = express.Router();

router.post(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.single) {
			throw new RouteNotFoundException(req.path);
		}

		const accountability: Accountability = {
			user: req.user,
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
		};

		const primaryKey = await ItemsService.createItem(req.collection, req.body, accountability);

		const result = await ItemsService.readItem(
			req.collection,
			primaryKey,
			req.sanitizedQuery,
			accountability
		);

		res.json({ data: result || null });
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

		const primaryKey = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;

		const result = await ItemsService.readItem(req.collection, primaryKey, req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});

		return res.json({
			data: result || null,
		});
	})
);

router.patch(
	'/:collection',
	collectionExists,
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (req.single === true) {
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
		}

		throw new RouteNotFoundException(req.path);
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

		const accountability: Accountability = {
			user: req.user,
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
		};

		const primaryKey = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;

		if (Array.isArray(primaryKey)) {
			const updatedPrimaryKey = await ItemsService.updateItem(
				req.collection,
				primaryKey,
				req.body,
				accountability
			);

			const result = await ItemsService.readItem(
				req.collection,
				updatedPrimaryKey,
				req.sanitizedQuery,
				accountability
			);

			res.json({ data: result || null });
		} else {
			const updatedPrimaryKey = await ItemsService.updateItem(
				req.collection,
				primaryKey,
				req.body,
				accountability
			);

			const result = await ItemsService.readItem(
				req.collection,
				updatedPrimaryKey,
				req.sanitizedQuery,
				accountability
			);

			res.json({ data: result || null });
		}
	})
);

router.delete(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res) => {
		const accountability: Accountability = {
			user: req.user,
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
		};

		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;

		await ItemsService.deleteItem(req.collection, pk, accountability);

		return res.status(200).end();
	})
);

export default router;
