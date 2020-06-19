import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as WebhooksService from '../services/webhooks';

const router = express.Router();

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const records = await WebhooksService.createWebhook(req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await WebhooksService.readWebhooks(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await WebhooksService.readWebhook(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res) => {
		const records = await WebhooksService.updateWebhook(
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
		await WebhooksService.deleteWebhook(req.params.pk);
		return res.status(200).end();
	})
);

export default router;
