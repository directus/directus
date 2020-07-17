import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as WebhooksService from '../services/webhooks';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_webhooks'));

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const primaryKey = await WebhooksService.createWebhook(req.body, {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const item = await WebhooksService.readWebhook(primaryKey, req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});

		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const records = await WebhooksService.readWebhooks(req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});
		return res.json({ data: records || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const record = await WebhooksService.readWebhook(req.params.pk, req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res) => {
		const primaryKey = await WebhooksService.updateWebhook(req.params.pk, req.body, {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await WebhooksService.readWebhook(primaryKey, req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});
		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await WebhooksService.deleteWebhook(req.params.pk, {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
