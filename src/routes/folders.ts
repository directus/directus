import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as FoldersService from '../services/folders';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_folders'),
	asyncHandler(async (req, res) => {
		const records = await FoldersService.createFolder(req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/',
	useCollection('directus_folders'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await FoldersService.readFolders(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_folders'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await FoldersService.readFolder(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_folders'),
	asyncHandler(async (req, res) => {
		const records = await FoldersService.updateFolder(
			req.params.pk,
			req.body,
			res.locals.query
		);
		return res.json({ data: records });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_folders'),
	asyncHandler(async (req, res) => {
		await FoldersService.deleteFolder(req.params.pk);
		return res.status(200).end();
	})
);

export default router;
