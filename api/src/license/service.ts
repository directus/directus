import { InvalidLicenseTokenError, InvalidPayloadError } from '@directus/errors';
import type { TelemetryReport } from '../telemetry/types/report.js';
import { normalizeLicenseKey, resolveProjectId, resolvePublicUrl } from './license-context.js';
import { requestLicenseService } from './request.js';
import type { LicensePayloadStatus } from './types.js';

type LicenseCheckResponse = {
	valid: boolean;
	status: LicensePayloadStatus;
	bound: boolean;
	plan: Record<string, unknown>;
	entitlements: Record<string, unknown>;
};

type LicenseRequestContext = {
	licenseKey: string;
	projectId?: string;
	publicUrl?: string;
	newPublicUrl?: string;
	usageMetrics?: TelemetryReport;
};

type ActivateLicenseResponse = {
	token: string;
	new_project_id?: string;
};

type ValidateLicenseResponse = {
	token: string;
	warnings?: string[];
};

type DeactivateLicenseRequest = {
	projectId?: string;
	licenseKey?: string;
	licenseToken?: string;
};

type DeactivateLicenseResponse = {
	deactivated: boolean;
};

export async function checkLicense({ licenseKey }: { licenseKey: string }): Promise<LicenseCheckResponse> {
	return requestLicenseService<LicenseCheckResponse>('POST', '/api/licenses/check', {
		license_key: normalizeLicenseKey(licenseKey),
	});
}

export async function activateLicense({
	licenseKey,
	projectId,
	publicUrl,
}: LicenseRequestContext): Promise<ActivateLicenseResponse> {
	const response = await requestLicenseService<ActivateLicenseResponse>('POST', '/api/licenses/activate', {
		license_key: normalizeLicenseKey(licenseKey),
		project_id: await resolveProjectId(projectId),
		public_url: resolvePublicUrl(publicUrl),
	});

	if (typeof response.token !== 'string' || response.token === '') {
		throw new InvalidLicenseTokenError({});
	}

	return response;
}

export async function validateLicense({
	licenseKey,
	projectId,
	publicUrl,
	newPublicUrl,
	usageMetrics,
}: LicenseRequestContext): Promise<ValidateLicenseResponse> {
	const resolvedPublicUrl = resolvePublicUrl(publicUrl);

	const response = await requestLicenseService<ValidateLicenseResponse>('POST', '/api/licenses/validate', {
		license_key: normalizeLicenseKey(licenseKey),
		project_id: await resolveProjectId(projectId),
		public_url: resolvedPublicUrl,
		...(newPublicUrl ? { new_public_url: resolvePublicUrl(newPublicUrl) } : {}),
		...(usageMetrics ? { usage_metrics: usageMetrics } : {}),
	});

	if (typeof response.token !== 'string' || response.token === '') {
		throw new InvalidLicenseTokenError({});
	}

	return response;
}

export async function deactivateLicense({
	licenseKey,
	licenseToken,
	projectId,
}: DeactivateLicenseRequest): Promise<DeactivateLicenseResponse> {
	const hasLicenseKey = typeof licenseKey === 'string' && licenseKey.trim() !== '';
	const hasLicenseToken = typeof licenseToken === 'string' && licenseToken.trim() !== '';

	if (hasLicenseKey === hasLicenseToken) {
		throw new InvalidPayloadError({ reason: 'Provide exactly one of license_key or license_token' });
	}

	return requestLicenseService<DeactivateLicenseResponse>('POST', '/api/licenses/deactivate', {
		project_id: await resolveProjectId(projectId),
		...(hasLicenseKey ? { license_key: normalizeLicenseKey(licenseKey!) } : {}),
		...(hasLicenseToken ? { license_token: licenseToken!.trim() } : {}),
	});
}
