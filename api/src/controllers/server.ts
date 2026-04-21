import { randomUUID } from 'node:crypto';
import { useEnv } from '@directus/env';
import {
	createError,
	ErrorCode,
	ForbiddenError,
	InvalidPayloadError,
	isDirectusError,
	RouteNotFoundError,
} from '@directus/errors';
import { format } from 'date-fns';
import { Router } from 'express';
import getDatabase from '../database/index.js';
import {
	createLicensePortal,
	EMPTY_LICENSE_ADDONS,
	getLicenseAddons,
	removeLicenseAddon,
	updateLicenseAddon,
} from '../license/addons.js';
import { getCurrentLicenseBinding } from '../license/binding.js';
import { isEnvOffline } from '../license/env.js';
import { normalizeOptionalLicenseKey } from '../license/license-context.js';
import {
	applyLicense,
	deactivateCurrentLicense,
	type LicenseResult,
	syncLicenseTokenFromService,
} from '../license/lifecycle.js';
import { checkLicense, deactivateLicense } from '../license/service.js';
import { useLogger } from '../logger/index.js';
import { respond } from '../middleware/respond.js';
import { SettingsService } from '../services/index.js';
import { ServerService } from '../services/server.js';
import { SpecificationService } from '../services/specifications.js';
import { getReport } from '../telemetry/lib/get-report.js';
import asyncHandler from '../utils/async-handler.js';
import { getLicensePayloadCacheTtl, writeCacheTokenPayload } from '../utils/cache-token-payload.js';
import { createAdmin } from '../utils/create-admin.js';

const router = Router();
const env = useEnv();
const logger = useLogger();

const LicenseOfflineUnsupportedError = createError<Record<string, never>>(
	'LICENSE_OFFLINE_UNSUPPORTED',
	'This operation is unavailable while DIRECTUS_LICENSE_OFFLINE_TOKEN is configured.',
	409,
);

if (env['OPENAPI_ENABLED'] !== false) {
	router.get(
		'/specs/oas',
		asyncHandler(async (req, res, next) => {
			const service = new SpecificationService({
				accountability: req.accountability,
				schema: req.schema,
			});

			res.locals['payload'] = await service.oas.generate(req.headers.host);
			return next();
		}),
		respond,
	);
}

if (env['GRAPHQL_INTROSPECTION'] !== false) {
	router.get(
		'/specs/graphql/:scope?',
		asyncHandler(async (req, res) => {
			const service = new SpecificationService({
				accountability: req.accountability,
				schema: req.schema,
			});

			const serverService = new ServerService({
				accountability: req.accountability,
				schema: req.schema,
			});

			const scope = req.params['scope'] || 'items';

			if (['items', 'system'].includes(scope) === false) throw new RouteNotFoundError({ path: req.path });

			const info = await serverService.serverInfo();
			const result = await service.graphql.generate(scope as 'items' | 'system');
			const filename = info['project'].project_name + '_' + format(new Date(), 'yyyy-MM-dd') + '.graphql';

			res.attachment(filename);
			res.send(result);
		}),
	);
}

router.get(
	'/info',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const data = await service.serverInfo();
		res.locals['payload'] = { data };
		return next();
	}),
	respond,
);

router.get(
	'/license',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (!(await service.isSetupCompleted()) || req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		const data = await service.licenseData();
		res.locals['payload'] = { data };
		return next();
	}),
	respond,
);

router.get(
	'/license/addons',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (!(await service.isSetupCompleted()) || req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		if (isEnvOffline()) {
			res.locals['payload'] = { data: EMPTY_LICENSE_ADDONS };
			return next();
		}

		const data = await getLicenseAddons();
		res.locals['payload'] = { data };
		return next();
	}),
	respond,
);

router.post(
	'/license/addon',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (!(await service.isSetupCompleted()) || req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		assertEnvOnline();

		const addonId = typeof req.body?.addon_id === 'string' ? req.body.addon_id.trim() : '';

		const quantity =
			typeof req.body?.quantity === 'number' && Number.isInteger(req.body.quantity) ? req.body.quantity : Number.NaN;

		if (addonId === '') {
			throw new InvalidPayloadError({ reason: 'addon_id is required' });
		}

		if (!Number.isFinite(quantity) || quantity < 1) {
			throw new InvalidPayloadError({ reason: 'quantity must be a positive integer' });
		}

		const usageReport = await getReport({ preserveCounts: true });
		const binding = await getCurrentLicenseBinding();

		const result = await updateLicenseAddon({
			addonId,
			quantity,
			operationId: typeof req.body?.operation_id === 'string' ? req.body.operation_id : randomUUID(),
			usageMetrics: usageReport,
		});

		await syncLicenseTokenFromService(result.token, {
			...(typeof binding.licenseKey === 'string' ? { licenseKey: binding.licenseKey } : {}),
		});

		res.locals['payload'] = { data: { success: true } };
		return next();
	}),
	respond,
);

router.delete(
	'/license/addon',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (!(await service.isSetupCompleted()) || req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		assertEnvOnline();

		const addonId = typeof req.body?.addon_id === 'string' ? req.body.addon_id.trim() : '';

		if (addonId === '') {
			throw new InvalidPayloadError({ reason: 'addon_id is required' });
		}

		const data = await removeLicenseAddon(addonId);
		res.locals['payload'] = { data };
		return next();
	}),
	respond,
);

router.post(
	'/license/portal',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (!(await service.isSetupCompleted()) || req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		assertEnvOnline();

		const data = await createLicensePortal();
		res.locals['payload'] = { data };
		return next();
	}),
	respond,
);

router.get(
	'/license/portal',
	asyncHandler(async (req, res) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (!(await service.isSetupCompleted()) || req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		assertEnvOnline();

		const data = await createLicensePortal();
		const portalUrl = data.url;

		if (typeof portalUrl !== 'string' || portalUrl.trim() === '') {
			throw new InvalidPayloadError({ reason: 'Licensing service did not return a billing portal URL.' });
		}

		res.redirect(302, portalUrl);
	}),
);

router.post(
	'/license/check',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if ((await service.isSetupCompleted()) && req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		assertEnvOnline();

		const licenseKey = normalizeOptionalLicenseKey(req.body.license_key);

		if (!licenseKey) {
			throw new InvalidPayloadError({ reason: 'license_key is required' });
		}

		const data = await checkLicense({ licenseKey });
		res.locals['payload'] = { data };
		return next();
	}),
	respond,
);

router.post(
	'/license/validate',
	asyncHandler(async (req, res, next) => {
		const explicitLicenseKey = normalizeOptionalLicenseKey(req.body.license_key);
		const binding = await getCurrentLicenseBinding();
		const source = binding.source;

		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (!(await service.isSetupCompleted()) || req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		assertEnvOnline();

		if (explicitLicenseKey && source === 'env') {
			throw new InvalidPayloadError({ reason: 'License key is managed in ENV' });
		}

		const activeLicenseKey = explicitLicenseKey ?? binding.licenseKey;

		if (!activeLicenseKey) {
			throw new InvalidPayloadError({ reason: 'No license key is configured' });
		}

		await applyLicense(activeLicenseKey, {
			...(binding.storedProjectId ? { projectId: binding.storedProjectId } : {}),
			source: explicitLicenseKey ? 'settings' : (binding.source ?? 'settings'),
			replaceTerminalLicense: explicitLicenseKey !== null,
		});

		res.locals['payload'] = { data: await service.licenseData() };
		return next();
	}),
	respond,
);

router.post(
	'/license/deactivate',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (!(await service.isSetupCompleted()) || req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		const data = await deactivateCurrentLicense();

		res.locals['payload'] = { data };
		return next();
	}),
	respond,
);

router.get(
	'/health',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const data = await service.health();

		res.setHeader('Content-Type', 'application/health+json');

		if (data['status'] === 'error') res.status(503);
		res.locals['payload'] = data;
		res.locals['cache'] = false;
		return next();
	}),
	respond,
);

router.post(
	'/setup',
	asyncHandler(async (req, res, next) => {
		const serverService = new ServerService({ schema: req.schema });

		if (await serverService.isSetupCompleted()) {
			throw new ForbiddenError();
		}

		const trimmedLicenseKey = normalizeOptionalLicenseKey(req.body.license_key);
		const activationState: { result: LicenseResult | null } = { result: null };

		if (trimmedLicenseKey && isEnvOffline()) {
			throw new LicenseOfflineUnsupportedError({});
		}

		try {
			await getDatabase().transaction(async (trx) => {
				await createAdmin(
					req.schema,
					{
						email: req.body.project_owner,
						password: req.body.password,
						first_name: req.body.first_name,
						last_name: req.body.last_name,
					},
					trx,
				);

				const settingsService = new SettingsService({ knex: trx, schema: req.schema });
				await settingsService.setOwner(req.body);

				if (trimmedLicenseKey) {
					const settings = (await settingsService.readSingleton({ fields: ['project_id'] })) as {
						project_id?: string;
					};

					activationState.result = await applyLicense(trimmedLicenseKey, {
						knex: trx,
						...(settings.project_id ? { projectId: settings.project_id } : {}),
						cache: false,
						source: 'settings',
					});
				}
			});

			if (activationState.result?.payload) {
				await writeCacheTokenPayload(
					activationState.result.payload,
					getLicensePayloadCacheTtl(activationState.result.payload),
				);
			}
		} catch (error: any) {
			const activationResult = activationState.result;

			if (
				trimmedLicenseKey &&
				activationResult?.action === 'activate' &&
				activationResult.token &&
				activationResult.projectId
			) {
				try {
					await deactivateLicense({
						projectId: activationResult.projectId,
						licenseToken: activationResult.token,
					});
				} catch (deactivateError) {
					logger.warn(deactivateError, '[license] Failed to compensate setup activation failure');
				}
			}

			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		res.locals['payload'] = { data: null };
		return next();
	}),
	respond,
);

export default router;

function assertEnvOnline(): void {
	if (isEnvOffline()) {
		throw new LicenseOfflineUnsupportedError({});
	}
}
