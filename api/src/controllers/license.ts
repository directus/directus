import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import express, { type RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import { getLicense, getLicenseManager } from '../license/manager.js';
import { ResolveInput } from '../license/schema.js';
import type { LicenseCheck, LicenseInfo } from '../license/types.js';
import { respond } from '../middleware/respond.js';
import asyncHandler from '../utils/async-handler.js';
import { isAdmin } from '../utils/is-admin.js';

const router = express.Router();

export const multipartHandler: RequestHandler = (req, _res, next) => {
	if (!isAdmin(req.accountability)) {
		throw new ForbiddenError();
	}

	return next();
};

router.get(
	'/',
	asyncHandler(async (_req, res, next) => {
		const licenseManager = getLicenseManager();
		const license = await getLicense();
		const licenseStatus = await licenseManager.getStatus();

		const payload: LicenseInfo = {
			type: license.meta.type,
			status: licenseStatus,
			source: licenseManager.getSource(),
			renews_at: license.meta.renews_at,
			expires_at: license.meta.expires_at,
			entitlements: license.entitlements,
			grace_period: license.meta.grace_period,
			offline: license.meta.offline,
			// TODO: Replace with actual stats
			usage: {
				seats: 1,
				collections: 15,
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
		if (req.body.license_key) {
			throw new InvalidPayloadError({ reason: 'A "license_key" is required' });
		}

		const licenseManager = getLicenseManager();

		await licenseManager.activate(req.body.license_key);

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
	'/check',
	asyncHandler(async (req, res, next) => {
		if (req.body.license_key) {
			throw new InvalidPayloadError({ reason: 'A "license_key" is required' });
		}

		const licenseManager = getLicenseManager();

		const license = await licenseManager.check(req.body.license_key);

		const payload: LicenseCheck = {
			type: license.type,
			expires_at: license.expires_at,
			production_enabled: license.production_enabled,
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

router.post(
	'/addons/:id',
	asyncHandler(async (req, _res, next) => {
		if (req.body.quantity) {
			throw new InvalidPayloadError({ reason: 'A "quantity" is required' });
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

router.get(
	'/pending-resolution',
	asyncHandler(async (req, res, next) => {
		const licenseManager = getLicenseManager();

		const payload = await licenseManager.pendingResolution({ adminId: req.accountability!.user! });

		res.locals['payload'] = { data: payload || null };
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
			throw new InvalidPayloadError({ reason: 'At least on entitlement must be resolved' });
		}

		const licenseManager = getLicenseManager();

		await licenseManager.applyResolution(req.accountability!.user!, data);

		return next();
	}),
	respond,
);

export default router;
