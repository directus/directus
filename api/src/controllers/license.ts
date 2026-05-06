import { InvalidPayloadError } from '@directus/errors';
import { type LicenseInfoOutput, type LicensePreviewOutput, ResolveInput } from '@directus/license';
import express from 'express';
import { fromZodError } from 'zod-validation-error';
import { getEntitlementManager } from '../license/index.js';
import { getLicense, getLicenseManager } from '../license/manager.js';
import checkIsAdmin from '../middleware/is-admin.js';
import { respond } from '../middleware/respond.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();

router.use(checkIsAdmin);

router.get(
	'/',
	asyncHandler(async (_req, res, next) => {
		const licenseManager = getLicenseManager();
		const entitlementManager = getEntitlementManager();

		const license = await getLicense();

		const payload: LicenseInfoOutput = {
			name: license.meta.name,
			status: await licenseManager.getStatus(),
			source: licenseManager.getSource(),
			renews_at: license.meta.renews_at,
			expires_at: license.meta.expires_at,
			entitlements: license.entitlements,
			grace_period: license.meta.grace_period,
			offline: license.meta.offline,
			usage: {
				seats: await entitlementManager.getUsage('seats'),
				collections: await entitlementManager.getUsage('collections'),
				// LICENSE-TODO: add getUsage once handler registered
				flows: 5,
			},
		};

		res.locals['payload'] = { data: payload };
		return next();
	}),
	respond,
);

router.post(
	'/',
	asyncHandler(async (req, _res, next) => {
		if (!req.body.license_key) {
			throw new InvalidPayloadError({ reason: 'A "license_key" is required' });
		}

		const licenseManager = getLicenseManager();

		await licenseManager.activate(req.body.license_key);

		return next();
	}),
	respond,
);

router.patch(
	'/',
	asyncHandler(async (req, _res, next) => {
		if (!req.body.license_key) {
			throw new InvalidPayloadError({ reason: 'A "license_key" is required' });
		}

		const licenseManager = getLicenseManager();

		await licenseManager.update(req.body.license_key);

		return next();
	}),
	respond,
);

router.delete(
	'/',
	asyncHandler(async (_req, _res, next) => {
		const licenseManager = getLicenseManager();

		await licenseManager.deactivate();

		return next();
	}),
	respond,
);

router.post(
	'/preview',
	asyncHandler(async (req, res, next) => {
		if (!req.body.license_key) {
			throw new InvalidPayloadError({ reason: 'A "license_key" is required' });
		}

		const licenseManager = getLicenseManager();

		const preview = await licenseManager.preview(req.body.license_key);

		const payload: LicensePreviewOutput = {
			plan_name: preview.name,
			expires_at: preview.expires_at,
			renews_at: preview.renews_at,
			production_enabled: preview.production_enabled,
		};

		res.locals['payload'] = { data: payload };
		return next();
	}),
	respond,
);

router.get(
	'/portal',
	asyncHandler(async (_req, res) => {
		const licenseManager = getLicenseManager();

		const portal = await licenseManager.billingPortalUrl();

		res.redirect(portal);
	}),
);

router.get(
	'/addons',
	asyncHandler(async (_req, res, next) => {
		const licenseManager = getLicenseManager();

		const payload = await licenseManager.availableAddons();

		res.locals['payload'] = { data: payload };
		return next();
	}),
	respond,
);

router.patch(
	'/addons/:id',
	asyncHandler(async (req, _res, next) => {
		if (typeof req.body.quantity !== 'number') {
			throw new InvalidPayloadError({ reason: 'A numbered "quantity" is required' });
		}

		const licenseManager = getLicenseManager();

		await licenseManager.setAddonQuantity({ addonId: req.params['id']!, quantity: req.body.quantity });

		return next();
	}),
	respond,
);

router.delete(
	'/addon/:id',
	asyncHandler(async (req, _res, next) => {
		const licenseManager = getLicenseManager();

		await licenseManager.removeAddon(req.params['id']!);

		return next();
	}),
	respond,
);

router.post(
	'/pending-resolution',
	asyncHandler(async (req, res, next) => {
		const licenseManager = getLicenseManager();

		const payload = await licenseManager.pendingResolution({
			adminId: req.accountability!.user!,
			licenseKey: req.body.license_key,
		});

		res.locals['payload'] = { data: payload };
		return next();
	}),
	respond,
);

router.post(
	'/resolve',
	asyncHandler(async (req, _res, next) => {
		const { error, data } = ResolveInput.safeParse(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: fromZodError(error).message });
		}

		if (Object.keys(data).length) {
			return next();
		}

		const licenseManager = getLicenseManager();

		await licenseManager.applyResolution(req.accountability!.user!, data);

		return next();
	}),
	respond,
);

export default router;
