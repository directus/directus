import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as RelationsService from '../services/relations';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_relations'),
	asyncHandler(async (req, res) => {
		const records = await RelationsService.createRelation(req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/',
	useCollection('directus_relations'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await RelationsService.readRelations(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_relations'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await RelationsService.readRelation(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_relations'),
	asyncHandler(async (req, res) => {
		const records = await RelationsService.updateRelation(
			req.params.pk,
			req.body,
			res.locals.query
		);
		return res.json({ data: records });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_relations'),
	asyncHandler(async (req, res) => {
		await RelationsService.deleteRelation(req.params.pk);
		return res.status(200).end();
	})
);

export default router;
