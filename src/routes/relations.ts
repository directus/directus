import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as RelationsService from '../services/relations';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_relations'));

router.post(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await RelationsService.createRelation(req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await RelationsService.readRelation(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const records = await RelationsService.readRelations(req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: records || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const record = await RelationsService.readRelation(req.params.pk, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await RelationsService.updateRelation(req.params.pk, req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await RelationsService.readRelation(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await RelationsService.deleteRelation(Number(req.params.pk), {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
