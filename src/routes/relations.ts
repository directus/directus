import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as RelationsService from '../services/relations';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_relations'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await RelationsService.createRelation(req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await RelationsService.readRelation(primaryKey, req.sanitizedQuery);
		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	useCollection('directus_relations'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		// const records = await RelationsService.readRelations(req.sanitizedQuery);
		// return res.json({ data: records || null });
	})
);

router.get(
	'/:pk',
	useCollection('directus_relations'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const record = await RelationsService.readRelation(req.params.pk, req.sanitizedQuery);
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_relations'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await RelationsService.updateRelation(req.params.pk, req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await RelationsService.readRelation(primaryKey, req.sanitizedQuery);
		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_relations'),
	asyncHandler(async (req, res) => {
		await RelationsService.deleteRelation(Number(req.params.pk), {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
