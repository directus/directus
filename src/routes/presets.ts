import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as CollectionPresetsService from '../services/presets';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_presets'));

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const primaryKey = await CollectionPresetsService.createCollectionPreset(req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const record = await CollectionPresetsService.readCollectionPreset(
			primaryKey,
			req.sanitizedQuery,
			{ role: req.role }
		);
		return res.json({ data: record || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const records = await CollectionPresetsService.readCollectionPresets(req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: records || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const record = await CollectionPresetsService.readCollectionPreset(
			req.params.pk,
			req.sanitizedQuery,
			{ role: req.role }
		);
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await CollectionPresetsService.updateCollectionPreset(
			req.params.pk,
			req.body,
			{
				role: req.role,
				ip: req.ip,
				userAgent: req.get('user-agent'),
				user: req.user,
			}
		);

		const record = await CollectionPresetsService.readCollectionPreset(
			primaryKey,
			req.sanitizedQuery,
			{ role: req.role }
		);
		return res.json({ data: record || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await CollectionPresetsService.deleteCollectionPreset(req.params.pk, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
