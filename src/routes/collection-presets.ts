import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as CollectionPresetsService from '../services/collection-presets';

const router = express.Router();

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const records = await CollectionPresetsService.createCollectionPreset(
			req.body,
			res.locals.query
		);
		return res.json({ data: records });
	})
);

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await CollectionPresetsService.readCollectionPresets(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await CollectionPresetsService.readCollectionPreset(
			req.params.pk,
			res.locals.query
		);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res) => {
		const records = await CollectionPresetsService.updateCollectionPreset(
			req.params.pk,
			req.body,
			res.locals.query
		);
		return res.json({ data: records });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await CollectionPresetsService.deleteCollectionPreset(req.params.pk);
		return res.status(200).end();
	})
);

export default router;
