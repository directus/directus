import { InvalidLicenseConfigError, InvalidLicenseTokenError, InvalidPayloadError } from '@directus/errors';
import type { Knex } from 'knex';
import { clearSystemCache } from '../cache.js';
import { useLogger } from '../logger/index.js';
import { getReport } from '../telemetry/lib/get-report.js';
import type { TelemetryReport } from '../telemetry/types/report.js';
import {
	clearCacheTokenPayload,
	getLicensePayloadCacheTtl,
	writeCacheTokenPayload,
} from '../utils/cache-token-payload.js';
import { getProjectId } from '../utils/get-project-id.js';
import { setProjectId } from '../utils/set-project-id.js';
import { verify } from '../utils/verify-token.js';
import { clearLicenseState, getCurrentLicenseBinding } from './binding.js';
import { getEnvOfflinePayload, isEnvOffline, toEnvOfflineConfigError } from './env.js';
import { LicenseCanceledError, LicenseExpiredError } from './errors.js';
import { hashLicenseKey, resolvePublicUrl } from './license-context.js';
import { activateLicense, deactivateLicense, validateLicense } from './service.js';
import { getLicenseToken, saveLicenseKey, saveLicenseToken, updateLicenseState } from './storage.js';
import type { LicenseStatus, LicenseTokenPayload } from './types.js';

const logger = useLogger();

type ApplyLicenseOptions = {
	knex?: Knex;
	projectId?: string;
	publicUrl?: string;
	cache?: boolean;
	source?: 'env' | 'settings';
	usageMetrics?: TelemetryReport;
	replaceTerminalLicense?: boolean;
};

type RefreshLicenseMode = 'startup' | 'scheduled';

export type LicenseResult = {
	action: 'activate' | 'validate';
	payload: LicenseTokenPayload;
	token: string;
	projectId?: string;
};

export async function applyLicense(licenseKey: string, options?: ApplyLicenseOptions): Promise<LicenseResult> {
	const binding = await getCurrentLicenseBinding(options?.knex);
	const projectId = options?.projectId ?? binding.storedProjectId ?? undefined;

	const requestedKeyHashMatches =
		typeof binding.storedKeyHash === 'string' && binding.storedKeyHash === hashLicenseKey(licenseKey);

	if (
		options?.replaceTerminalLicense === true &&
		options?.source === 'settings' &&
		binding.source !== 'env' &&
		binding.terminal !== null &&
		requestedKeyHashMatches === false &&
		binding.durableStatus !== 'active'
	) {
		await tryDeactivateRetainedTerminalLicense(binding, options?.knex, projectId);
	}

	if (binding.durableStatus === 'active') {
		return requestedKeyHashMatches
			? validateExistingLicense(licenseKey, { ...options, ...(projectId ? { projectId } : {}) })
			: rotateLicense(licenseKey, binding, { ...options, ...(projectId ? { projectId } : {}) });
	}

	return activateNewLicense(licenseKey, { ...options, ...(projectId ? { projectId } : {}) });
}

export async function deactivateCurrentLicense(options?: {
	knex?: Knex;
	required?: boolean;
	licenseStatus?: LicenseStatus;
}) {
	const binding = await getCurrentLicenseBinding(options?.knex);
	const projectId = binding.storedProjectId ?? undefined;
	const licenseToken = await getLicenseToken(options?.knex);
	const licenseKey = binding.licenseKey;

	const hasMatchingKeyHash =
		typeof licenseKey === 'string' &&
		typeof binding.storedKeyHash === 'string' &&
		binding.storedKeyHash === hashLicenseKey(licenseKey);

	const canUseLicenseKey = typeof licenseKey === 'string' && licenseKey !== '' && hasMatchingKeyHash;
	let deactivationCredential: { licenseKey: string } | { licenseToken: string } | null = null;

	if (canUseLicenseKey) {
		deactivationCredential = { licenseKey };
	} else if (licenseToken) {
		deactivationCredential = { licenseToken };
	}

	if (!projectId) {
		if (options?.required === false) {
			await clearLocalLicenseState(options);
			return null;
		}

		throw new InvalidPayloadError({ reason: 'Project ID is not configured' });
	}

	if (!deactivationCredential) {
		if (options?.required === false) {
			await clearLocalLicenseState(options);
			return null;
		}

		throw new InvalidPayloadError({ reason: 'No active license binding was found' });
	}

	const result = await deactivateLicense({
		projectId,
		...deactivationCredential,
	});

	await clearLocalLicenseState(options);

	return result;
}

export async function refreshLicense(options?: { mode?: RefreshLicenseMode }): Promise<boolean> {
	if (isEnvOffline()) {
		return false;
	}

	const binding = await getCurrentLicenseBinding();
	const mode = options?.mode ?? 'scheduled';

	const configuredKeyHashMatches =
		typeof binding.licenseKey === 'string' &&
		typeof binding.storedKeyHash === 'string' &&
		binding.storedKeyHash === hashLicenseKey(binding.licenseKey);

	if (!binding.licenseKey) {
		return false;
	}

	if (binding.durableStatus === 'active' && configuredKeyHashMatches) {
		await applyLicense(binding.licenseKey, {
			...(binding.storedProjectId ? { projectId: binding.storedProjectId } : {}),
			source: binding.source ?? 'settings',
		});

		return true;
	}

	if (mode === 'scheduled') {
		return false;
	}

	if (binding.durableStatus === 'deactivated' && configuredKeyHashMatches) {
		return false;
	}

	if (binding.source) {
		await applyLicense(binding.licenseKey, {
			...(binding.storedProjectId ? { projectId: binding.storedProjectId } : {}),
			source: binding.source,
		});

		return true;
	}

	return false;
}

export async function restoreStoredLicense(options?: {
	knex?: Knex;
	cache?: boolean;
}): Promise<LicenseTokenPayload | null> {
	const envPayload = await getEnvOfflinePayload();

	if (envPayload) {
		if (options?.cache !== false) {
			await clearCacheTokenPayload();
			await writeCacheTokenPayload(envPayload, getLicensePayloadCacheTtl(envPayload));
		}

		return envPayload;
	}

	const binding = await getCurrentLicenseBinding(options?.knex);

	const configuredKeyHashMatches =
		typeof binding.licenseKey === 'string' &&
		typeof binding.storedKeyHash === 'string' &&
		binding.storedKeyHash === hashLicenseKey(binding.licenseKey);

	if (!binding.licenseKey || binding.durableStatus !== 'active' || !configuredKeyHashMatches) {
		return null;
	}

	const rawToken = await getLicenseToken(options?.knex);

	if (!rawToken) {
		return null;
	}

	const payload = await verify(rawToken, { mode: 'local' });

	if (options?.cache !== false) {
		await clearCacheTokenPayload();
		await writeCacheTokenPayload(payload, getLicensePayloadCacheTtl(payload));
	}

	return payload;
}

export async function initializeLicenseRuntime(options?: { mode?: RefreshLicenseMode }): Promise<void> {
	let restoredPayload: LicenseTokenPayload | null = null;
	const mode = options?.mode ?? 'startup';

	try {
		restoredPayload = await restoreStoredLicense();
	} catch (error) {
		if (error instanceof InvalidLicenseConfigError) {
			throw error;
		}

		if (isEnvOffline() && error instanceof InvalidLicenseTokenError) {
			throw toEnvOfflineConfigError(error);
		}

		restoredPayload = null;
	}

	if (restoredPayload?.metadata.refresh_interval !== 0) {
		await refreshLicense({ mode });
	}
}

export async function syncLicenseTokenFromService(
	token: string,
	options?: { knex?: Knex; cache?: boolean; licenseKey?: string },
): Promise<LicenseTokenPayload> {
	if (typeof token !== 'string' || token.trim() === '') {
		throw new InvalidLicenseTokenError({});
	}

	const normalizedToken = token.trim();

	await saveLicenseToken(normalizedToken, options?.knex);

	await updateLicenseState(
		{
			license_status: 'active',
			license_terminal_status: null,
			license_grace_on: null,
			...(options?.licenseKey ? { license_key_hash: hashLicenseKey(options.licenseKey) } : {}),
		},
		options?.knex,
	);

	const payload = await verify(normalizedToken);

	if (options?.cache !== false) {
		await clearCacheTokenPayload();
		await writeCacheTokenPayload(payload, getLicensePayloadCacheTtl(payload));
	}

	await clearSystemCache();

	return payload;
}

async function activateNewLicense(licenseKey: string, options?: ApplyLicenseOptions): Promise<LicenseResult> {
	const projectId = options?.projectId ?? (await getProjectId());

	const request: {
		licenseKey: string;
		publicUrl: string;
		projectId?: string;
	} = {
		licenseKey,
		publicUrl: options?.publicUrl ?? resolvePublicUrl(),
	};

	if (projectId) {
		request.projectId = projectId;
	}

	const response = await activateLicense(request);
	const resolvedProjectId = response.new_project_id ?? projectId ?? (await getProjectId());

	await saveLicenseToken(response.token, options?.knex);

	if (options?.source !== 'env') {
		await saveLicenseKey(licenseKey, options?.knex);
	}

	await updateLicenseState(
		{
			license_key_hash: hashLicenseKey(licenseKey),
			license_status: 'active',
			license_terminal_status: null,
			license_grace_on: null,
			...(resolvedProjectId ? { project_id: resolvedProjectId } : {}),
		},
		options?.knex,
	);

	if (resolvedProjectId) {
		await setProjectId(resolvedProjectId, options?.knex);
	}

	const payload = await verify(response.token);
	const cacheTtl = getLicensePayloadCacheTtl(payload);

	if (options?.cache !== false) {
		await clearCacheTokenPayload();
		await writeCacheTokenPayload(payload, cacheTtl);
	}

	await clearSystemCache();

	return {
		action: 'activate',
		payload,
		token: response.token,
		...(resolvedProjectId ? { projectId: resolvedProjectId } : {}),
	};
}

async function rotateLicense(
	licenseKey: string,
	binding: Awaited<ReturnType<typeof getCurrentLicenseBinding>>,
	options?: ApplyLicenseOptions,
): Promise<LicenseResult> {
	const projectId = options?.projectId ?? binding.storedProjectId ?? undefined;
	const previousLicenseToken = await getLicenseToken(options?.knex);

	const previousLicenseKey =
		binding.source === 'settings' &&
		typeof binding.licenseKey === 'string' &&
		typeof binding.storedKeyHash === 'string' &&
		binding.storedKeyHash === hashLicenseKey(binding.licenseKey)
			? binding.licenseKey
			: undefined;

	if (!projectId || (!previousLicenseToken && !previousLicenseKey)) {
		return activateNewLicense(licenseKey, options);
	}

	if (previousLicenseToken) {
		await deactivateLicense({
			projectId,
			licenseToken: previousLicenseToken,
		});
	} else if (previousLicenseKey) {
		await deactivateLicense({
			projectId,
			licenseKey: previousLicenseKey,
		});
	}

	try {
		return await activateNewLicense(licenseKey, options);
	} catch (error) {
		if (previousLicenseKey) {
			try {
				await activateNewLicense(previousLicenseKey, {
					...options,
					projectId,
					source: 'settings',
				});
			} catch (rollbackError) {
				logger.warn(
					{
						projectId,
						rollbackCredential: 'settings_license_key',
						rollbackErrorName: rollbackError instanceof Error ? rollbackError.name : typeof rollbackError,
					},
					'[license] Failed to reactivate previous license after activation failure',
				);

				await clearLocalLicenseState(
					options?.knex ? { knex: options.knex, licenseStatus: 'inactive' } : { licenseStatus: 'inactive' },
				);
			}
		} else {
			await clearLocalLicenseState(
				options?.knex ? { knex: options.knex, licenseStatus: 'inactive' } : { licenseStatus: 'inactive' },
			);
		}

		throw error;
	}
}

async function validateExistingLicense(licenseKey: string, options?: ApplyLicenseOptions): Promise<LicenseResult> {
	const projectId = options?.projectId ?? (await getProjectId());

	const usageMetrics =
		options?.usageMetrics ??
		(await getReport(options?.knex ? { knex: options.knex, preserveCounts: true } : { preserveCounts: true }));

	const request: {
		licenseKey: string;
		publicUrl: string;
		newPublicUrl?: string;
		usageMetrics: TelemetryReport;
		projectId?: string;
	} = {
		licenseKey,
		publicUrl: options?.publicUrl ?? resolvePublicUrl(),
		usageMetrics,
	};

	const rawToken = await getLicenseToken(options?.knex);
	let storedPayload: LicenseTokenPayload | null = null;

	if (rawToken) {
		try {
			storedPayload = await verify(rawToken, { mode: 'local' });
		} catch {
			storedPayload = null;
		}
	}

	if (storedPayload?.metadata.public_url && storedPayload.metadata.public_url !== request.publicUrl) {
		request.newPublicUrl = request.publicUrl;
		request.publicUrl = storedPayload.metadata.public_url;
	}

	if (projectId) {
		request.projectId = projectId;
	}

	let response;

	try {
		response = await validateLicense(request);
	} catch (error) {
		if (error instanceof LicenseCanceledError || error instanceof LicenseExpiredError) {
			await updateLicenseState(
				{
					license_terminal_status: error instanceof LicenseCanceledError ? 'canceled' : 'expired',
				},
				options?.knex,
			);
		}

		throw error;
	}

	const payload = await verify(response.token);
	const resolvedProjectId = projectId ?? payload.metadata.project_id;
	const cacheTtl = getLicensePayloadCacheTtl(payload);

	await saveLicenseToken(response.token, options?.knex);

	await updateLicenseState(
		{
			license_key_hash: hashLicenseKey(licenseKey),
			license_status: 'active',
			license_terminal_status: null,
			license_grace_on: null,
		},
		options?.knex,
	);

	if (options?.cache !== false) {
		await clearCacheTokenPayload();
		await writeCacheTokenPayload(payload, cacheTtl);
	}

	await clearSystemCache();

	return {
		action: 'validate',
		payload,
		token: response.token,
		...(resolvedProjectId ? { projectId: resolvedProjectId } : {}),
	};
}

async function tryDeactivateRetainedTerminalLicense(
	binding: Awaited<ReturnType<typeof getCurrentLicenseBinding>>,
	knex: Knex | undefined,
	projectId: string | undefined,
) {
	if (!projectId) {
		return;
	}

	const previousLicenseToken = await getLicenseToken(knex);

	const previousLicenseKey =
		binding.source === 'settings' &&
		typeof binding.licenseKey === 'string' &&
		typeof binding.storedKeyHash === 'string' &&
		binding.storedKeyHash === hashLicenseKey(binding.licenseKey)
			? binding.licenseKey
			: undefined;

	if (!previousLicenseToken && !previousLicenseKey) {
		return;
	}

	try {
		if (previousLicenseToken) {
			await deactivateLicense({
				projectId,
				licenseToken: previousLicenseToken,
			});
		} else if (previousLicenseKey) {
			await deactivateLicense({
				projectId,
				licenseKey: previousLicenseKey,
			});
		}
	} catch (error) {
		logger.warn(
			{
				projectId,
				terminal: binding.terminal,
				deactivationCredential: previousLicenseToken ? 'license_token' : 'settings_license_key',
				deactivationErrorName: error instanceof Error ? error.name : typeof error,
			},
			'[license] Failed to deactivate retained terminal license before activation',
		);
	}
}

async function clearLocalLicenseState(options?: { knex?: Knex; licenseStatus?: LicenseStatus }) {
	await clearCacheTokenPayload();
	await clearLicenseState({ licenseStatus: options?.licenseStatus ?? 'deactivated' }, options?.knex);
	await clearSystemCache();
}
