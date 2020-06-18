import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as FilesService from '../services/files';

const router = express.Router();

/** @TODO This needs to support multipart form-data for file uploads */
// router.post(
// 	'/',
// 	asyncHandler(async (req, res) => {
// 		const records = await FilesService.createFile(
// 			req.body,
// 			res.locals.query
// 		);
// 		return res.json({ data: records });
// 	})
// );

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await FilesService.readFiles(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await FilesService.readFile(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res) => {
		const records = await FilesService.updateFile(req.params.pk, req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await FilesService.deleteFile(req.params.pk);
		return res.status(200).end();
	})
);

export default router;
