import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import express, { type RequestHandler } from 'express';
import { getLicense, getLicenseManager } from '../license/manager.js';
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
