import {
	ForbiddenError,
	InvalidLicenseConfigError,
	InvalidLicenseKeyError,
	InvalidPayloadError,
	isDirectusError,
	ServiceUnavailableError,
} from '@directus/errors';
import type { AxiosError } from 'axios';
import axios from 'axios';
import { useLogger } from '../logger/index.js';
import {
	AddonNotAllowedError,
	BillingLinkageMissingError,
	BindingMismatchError,
	LicenseBoundError,
	LicenseCanceledError,
	LicenseExpiredError,
	NoPaymentMethodError,
	SeatOverflowError,
	SubscriptionPastDueError,
} from './errors.js';

type LicenseServiceError = {
	code?: string;
	error?: string;
	retry_after?: number;
	[key: string]: unknown;
};

const logger = useLogger();

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
	const extensions = extractErrorExtensions(axiosError.response?.data);

	if (isTransientLicenseError(error)) {
		throw new ServiceUnavailableError({ service: 'Licensing Service', reason });
	}

	if (code === 'INVALID_CREDENTIALS') {
		throw new InvalidLicenseConfigError({ reason });
	}

	if (code === 'BAD_REQUEST' && axiosError.response?.status === 400) {
		throw new InvalidPayloadError({ reason });
	}

	if (code === 'BINDING_MISMATCH') {
		throw new BindingMismatchError();
	}

	if (code === 'LICENSE_BOUND') {
		throw new LicenseBoundError();
	}

	if (code === 'LICENSE_EXPIRED') {
		throw new LicenseExpiredError();
	}

	if (code === 'LICENSE_CANCELED') {
		throw new LicenseCanceledError();
	}

	if (code === 'SUBSCRIPTION_PAST_DUE') {
		throw new SubscriptionPastDueError(extensions);
	}

	if (code === 'ADDON_NOT_ALLOWED') {
		throw new AddonNotAllowedError();
	}

	if (code === 'NO_PAYMENT_METHOD') {
		throw new NoPaymentMethodError(extensions);
	}

	if (code === 'BILLING_LINKAGE_MISSING') {
		throw new BillingLinkageMissingError(extensions);
	}

	if (code === 'SEAT_OVERFLOW') {
		throw new SeatOverflowError(extensions);
	}

	if (axiosError.response?.status === 403) {
		logger.warn(
			{
				code: code ?? null,
				status: axiosError.response.status,
			},
			'[license] Received unknown forbidden response from licensing service',
		);

		throw new ForbiddenError({ reason });
	}

	throw new InvalidLicenseKeyError({ reason });
}

function extractErrorExtensions(payload: LicenseServiceError | undefined): Record<string, unknown> {
	if (!payload || typeof payload !== 'object') return {};

	const entries = Object.entries(payload).filter(([key]) => key !== 'code' && key !== 'error');
	return Object.fromEntries(entries);
}
