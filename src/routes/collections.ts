import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as CollectionsService from '../services/collections';
import { schemaInspector } from '../database';
import { CollectionNotFoundException } from '../exceptions';

const router = Router();

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const data = await CollectionsService.readAll(req.sanitizedQuery);
		res.json({ data });
	})
);

router.get(
	'/:collection',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const exists = await schemaInspector.hasTable(req.params.collection);

		if (exists === false) throw new CollectionNotFoundException(req.params.collection);

		const data = await CollectionsService.readOne(req.params.collection, req.sanitizedQuery);
		res.json({ data });
	})
);

export default router;
