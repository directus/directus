import {
	InvalidLicenseConfigError,
	InvalidLicenseKeyError,
	InvalidPayloadError,
	isDirectusError,
	ServiceUnavailableError,
} from '@directus/errors';
import type { AxiosError } from 'axios';
import axios from 'axios';

type LicenseServiceError = {
	code?: string;
	error?: string;
	retry_after?: number;
};

export function isTransientLicenseError(error: unknown): boolean {
	if (!axios.isAxiosError(error)) return false;

	const code = error.response?.data?.code;
	return (
		!error.response ||
		error.response?.status === 503 ||
		code === 'SERVICE_UNAVAILABLE' ||
		code === 'CACHE_STALE' ||
		code === 'OPERATION_IN_PROGRESS'
	);
}

export function handleLicenseApiError(error: unknown): never {
	if (isDirectusError(error)) throw error;
	if (!axios.isAxiosError(error)) throw error;

	const axiosError = error as AxiosError<LicenseServiceError>;
	const reason = axiosError.response?.data?.error ?? axiosError.message ?? String(axiosError);
	const code = axiosError.response?.data?.code;

	if (isTransientLicenseError(error)) {
		throw new ServiceUnavailableError({ service: 'Licensing Service', reason });
	}

	if (code === 'INVALID_CREDENTIALS') {
		throw new InvalidLicenseConfigError({ reason });
	}

	if (code === 'BAD_REQUEST' && axiosError.response?.status === 400) {
		throw new InvalidPayloadError({ reason });
	}

	throw new InvalidLicenseKeyError({ reason });
}
