import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as WebhooksService from '../services/webhooks';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_webhooks'),
	asyncHandler(async (req, res) => {
		const primaryKey = await WebhooksService.createWebhook(req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const item = await WebhooksService.readWebhook(primaryKey, req.sanitizedQuery);

		return res.json({ data: item });
	})
);

router.get(
	'/',
	useCollection('directus_webhooks'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await WebhooksService.readWebhooks(req.sanitizedQuery);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_webhooks'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await WebhooksService.readWebhook(req.params.pk, req.sanitizedQuery);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_webhooks'),
	asyncHandler(async (req, res) => {
		const primaryKey = await WebhooksService.updateWebhook(req.params.pk, req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await WebhooksService.readWebhook(primaryKey, req.sanitizedQuery);
		return res.json({ data: item });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_webhooks'),
	asyncHandler(async (req, res) => {
		await WebhooksService.deleteWebhook(req.params.pk, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
