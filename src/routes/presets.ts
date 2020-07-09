import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as CollectionPresetsService from '../services/presets';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_presets'),
	asyncHandler(async (req, res) => {
		const primaryKey = await CollectionPresetsService.createCollectionPreset(req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const record = await CollectionPresetsService.readCollectionPreset(
			primaryKey,
			req.sanitizedQuery
		);
		return res.json({ data: record });
	})
);

router.get(
	'/',
	useCollection('directus_presets'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await CollectionPresetsService.readCollectionPresets(req.sanitizedQuery);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_presets'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await CollectionPresetsService.readCollectionPreset(
			req.params.pk,
			req.sanitizedQuery
		);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_presets'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await CollectionPresetsService.updateCollectionPreset(
			req.params.pk,
			req.body,
			{
				ip: req.ip,
				userAgent: req.get('user-agent'),
				user: req.user,
			}
		);

		const record = await CollectionPresetsService.readCollectionPreset(
			primaryKey,
			req.sanitizedQuery
		);
		return res.json({ data: record });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_presets'),
	asyncHandler(async (req, res) => {
		await CollectionPresetsService.deleteCollectionPreset(req.params.pk, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
