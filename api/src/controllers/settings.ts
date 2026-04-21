import { ErrorCode, InvalidPayloadError, isDirectusError } from '@directus/errors';
import express from 'express';
import { getCurrentLicenseBinding } from '../license/binding.js';
import { LicenseChangeBlockedError } from '../license/errors.js';
import { assessProposedLicenseChange } from '../license/license-change.js';
import { normalizeOptionalLicenseKey } from '../license/license-context.js';
import { applyLicense, deactivateCurrentLicense } from '../license/lifecycle.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { SettingsService } from '../services/settings.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();

router.use(useCollection('directus_settings'));

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new SettingsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const records = await service.readSingleton(req.sanitizedQuery);
		res.locals['payload'] = { data: records || null };
		return next();
	}),
	respond,
);

router.post(
	'/owner',
	asyncHandler(async (req, _res, next) => {
		const service = new SettingsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.setOwner(req.body);

		return next();
	}),
	respond,
);

router.patch(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new SettingsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const payload = { ...req.body };
		const hasLicenseKeyUpdate = Object.hasOwn(payload, 'license_key');
		const nextLicenseKey = normalizeOptionalLicenseKey(payload.license_key);

		delete payload.license_token;
		delete payload.license_key_hash;
		delete payload.license_status;
		delete payload.license_terminal_status;
		delete payload.license_grace_on;

		if (hasLicenseKeyUpdate) {
			delete payload.license_key;
			const binding = await getCurrentLicenseBinding();
			const source = binding.source;

			if (source === 'env' && nextLicenseKey) {
				throw new InvalidPayloadError({ reason: 'License key is managed in ENV' });
			}

			if (nextLicenseKey) {
				const assessment = await assessProposedLicenseChange({
					accountability: req.accountability,
					licenseKey: nextLicenseKey,
					schema: req.schema,
				});

				if (!assessment.compliant) {
					throw new LicenseChangeBlockedError({ assessment });
				}

				await applyLicense(nextLicenseKey, { source: 'settings', replaceTerminalLicense: true });
			} else if (source !== 'env') {
				await deactivateCurrentLicense({ required: false });
			}
		}

		if (Object.keys(payload).length > 0) {
			await service.upsertSingleton(payload);
		}

		try {
			const record = await service.readSingleton(req.sanitizedQuery);
			res.locals['payload'] = { data: record || null };
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond,
);

export default router;
