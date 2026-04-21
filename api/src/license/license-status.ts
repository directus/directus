import { DEFAULT_ONBOARDING_GRACE_MS } from './constants.js';
import type { DerivedLicenseStatus, LicenseGraceType, LicensePayloadStatus } from './types.js';

type StatusResult = {
	status: DerivedLicenseStatus;
	locked: boolean;
	graceType: LicenseGraceType;
};

export function getDerivedLicenseStatus(options: {
	durableStatus: string | null | undefined;
	payloadStatus?: LicensePayloadStatus | null | undefined;
	tokenExpiresAt?: number | null | undefined;
	gracePeriod?: number | null | undefined;
	graceOn?: string | Date | null | undefined;
	hasValidPayload: boolean;
	isFallbackCompliant?: boolean | undefined;
}): StatusResult {
	const onboardingGraceActive = isOnboardingGraceActive(options.graceOn);
	const payloadStatus = options.payloadStatus;

	if (options.hasValidPayload) {
		if (payloadStatus === 'canceled') {
			return { status: 'canceled', locked: true, graceType: null };
		}

		if (payloadStatus === 'past_due') {
			return { status: 'grace', locked: false, graceType: 'expiration' };
		}

		if (payloadStatus === 'expired') {
			if (isExpirationGraceActive(options.tokenExpiresAt, options.gracePeriod)) {
				return { status: 'grace', locked: false, graceType: 'expiration' };
			}

			return { status: 'locked', locked: true, graceType: null };
		}

		return { status: 'active', locked: false, graceType: null };
	}

	if (onboardingGraceActive) {
		return { status: 'grace', locked: false, graceType: 'onboarding' };
	}

	if (options.isFallbackCompliant === true) {
		if (options.durableStatus === 'active') {
			return { status: 'invalid', locked: false, graceType: null };
		}

		return { status: 'inactive', locked: false, graceType: null };
	}

	if (options.isFallbackCompliant === false) {
		return { status: 'locked', locked: true, graceType: null };
	}

	if (options.durableStatus === 'active') {
		return { status: 'locked', locked: true, graceType: null };
	}

	return { status: 'inactive', locked: false, graceType: null };
}

export function isOnboardingGraceActive(graceOn: string | Date | null | undefined): boolean {
	if (!graceOn) return false;

	const startedAt = new Date(graceOn).getTime();
	if (Number.isNaN(startedAt)) return false;

	return Date.now() - startedAt < DEFAULT_ONBOARDING_GRACE_MS;
}

function isExpirationGraceActive(
	tokenExpiresAt: number | null | undefined,
	gracePeriod: number | null | undefined,
): boolean {
	if (typeof tokenExpiresAt !== 'number' || Number.isNaN(tokenExpiresAt)) {
		return false;
	}

	if (typeof gracePeriod !== 'number' || Number.isNaN(gracePeriod)) {
		return false;
	}

	return Date.now() <= tokenExpiresAt * 1000 + gracePeriod * 1000;
}
