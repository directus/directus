import { InvalidLicenseConfigError } from '@directus/errors';
import type { TelemetryReport } from '../telemetry/types/report.js';
import { getCurrentLicenseBinding } from './binding.js';
import { isEnvOffline } from './env.js';
import { hashLicenseKey, normalizeLicenseKey } from './license-context.js';
import { requestLicenseService } from './request.js';

type LicenseAddonOptionsResponse = {
	current_subscription: Record<string, unknown>;
	available_addons: Record<string, unknown>[];
};

type LicensePortalResponse = {
	url: string;
};

type LicenseAddonMutationResponse = {
	token: string;
};

type LicenseAddonCancelResponse = {
	success: boolean;
};

type LicenseBindingContext = {
	licenseKey: string;
	projectId: string;
};

type LicenseAddonMutationRequest = {
	addonId: string;
	quantity: number;
	operationId: string;
	usageMetrics: TelemetryReport;
};

export const EMPTY_LICENSE_ADDONS: LicenseAddonOptionsResponse = {
	current_subscription: {},
	available_addons: [],
};

export async function getLicenseAddons(): Promise<LicenseAddonOptionsResponse> {
	if (isEnvOffline()) {
		return EMPTY_LICENSE_ADDONS;
	}

	const binding = await getBoundLicenseContext();

	if (!binding) {
		return EMPTY_LICENSE_ADDONS;
	}

	return requestLicenseService<LicenseAddonOptionsResponse>('POST', '/api/licenses/addons/options', {
		license_key: binding.licenseKey,
		project_id: binding.projectId,
	});
}

export async function createLicensePortal(): Promise<LicensePortalResponse> {
	const binding = await requireBoundLicenseContext();

	return requestLicenseService<LicensePortalResponse>('POST', '/api/licenses/portal', {
		license_key: binding.licenseKey,
		project_id: binding.projectId,
	});
}

export async function updateLicenseAddon({
	addonId,
	quantity,
	operationId,
	usageMetrics,
}: LicenseAddonMutationRequest): Promise<LicenseAddonMutationResponse> {
	const binding = await requireBoundLicenseContext();

	return requestLicenseService<LicenseAddonMutationResponse>('POST', '/api/licenses/addon', {
		license_key: binding.licenseKey,
		project_id: binding.projectId,
		addon_id: addonId,
		quantity,
		operation_id: operationId,
		usage_metrics: usageMetrics,
	});
}

export async function removeLicenseAddon(addonId: string): Promise<LicenseAddonCancelResponse> {
	const binding = await requireBoundLicenseContext();

	return requestLicenseService<LicenseAddonCancelResponse>('DELETE', '/api/licenses/addon', {
		license_key: binding.licenseKey,
		project_id: binding.projectId,
		addon_id: addonId,
	});
}

async function requireBoundLicenseContext(): Promise<LicenseBindingContext> {
	const binding = await getBoundLicenseContext();

	if (!binding) {
		throw new InvalidLicenseConfigError({ reason: 'An active bound license is required for this billing operation.' });
	}

	return binding;
}

async function getBoundLicenseContext(): Promise<LicenseBindingContext | null> {
	const binding = await getCurrentLicenseBinding();
	const licenseKey = binding.licenseKey;
	const projectId = binding.storedProjectId;

	const configuredKeyHashMatches =
		typeof licenseKey === 'string' &&
		typeof binding.storedKeyHash === 'string' &&
		binding.storedKeyHash === hashLicenseKey(licenseKey);

	if (
		!licenseKey ||
		!projectId ||
		binding.durableStatus !== 'active' ||
		(binding.source === 'env' && !configuredKeyHashMatches)
	) {
		return null;
	}

	return {
		licenseKey: normalizeLicenseKey(licenseKey),
		projectId,
	};
}
