import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import useCollection from '../middleware/use-collection';
import FoldersService from '../services/folders';

const router = express.Router();

router.use(useCollection('directus_folders'));

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const service = new FoldersService({ accountability: req.accountability });
		const primaryKey = await service.create(req.body);
		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({ data: record || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new FoldersService({ accountability: req.accountability });
		const records = await service.readByQuery(req.sanitizedQuery);

		return res.json({ data: records || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new FoldersService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new FoldersService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);
		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({ data: record || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		const service = new FoldersService({ accountability: req.accountability });
		await service.delete(req.params.pk);

		return res.status(200).end();
	})
);

export default router;
