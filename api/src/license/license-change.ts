import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions } from '@directus/types';
import { LicenseDeactivationService } from '../services/license-deactivation.js';
import { normalizeLicenseEntitlements } from './entitlements.js';
import { checkLicense } from './service.js';
import type {
	LicenseDeactivationApplyPayload,
	LicenseDeactivationApplyResult,
	LicenseDeactivationAssessment,
	LicenseEntitlements,
} from './types.js';

type ProposedLicenseChangeOptions = AbstractServiceOptions & {
	licenseKey: string;
};

type ProposedLicenseChangeApplyOptions = ProposedLicenseChangeOptions & {
	payload: LicenseDeactivationApplyPayload;
};

export async function assessProposedLicenseChange(
	options: ProposedLicenseChangeOptions,
): Promise<LicenseDeactivationAssessment> {
	const targetEntitlements = await getProposedLicenseEntitlements(options.licenseKey);
	const { licenseKey: _licenseKey, ...serviceOptions } = options;

	const service = new LicenseDeactivationService({
		...serviceOptions,
		targetEntitlements,
		targetMode: 'license_change',
	});

	return service.assess();
}

export async function applyProposedLicenseRemediation(
	options: ProposedLicenseChangeApplyOptions,
): Promise<LicenseDeactivationApplyResult> {
	const targetEntitlements = await getProposedLicenseEntitlements(options.licenseKey);
	const { licenseKey: _licenseKey, payload, ...serviceOptions } = options;

	const service = new LicenseDeactivationService({
		...serviceOptions,
		targetEntitlements,
		targetMode: 'license_change',
	});

	return service.apply(payload);
}

async function getProposedLicenseEntitlements(licenseKey: string): Promise<LicenseEntitlements> {
	const response = await checkLicense({ licenseKey });

	if (response.valid !== true) {
		throw new InvalidPayloadError({ reason: 'The provided license key is invalid.' });
	}

	return normalizeLicenseEntitlements(response.entitlements);
}
