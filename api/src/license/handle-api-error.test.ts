import axios from 'axios';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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
import { handleLicenseApiError } from './handle-api-error.js';

const warn = vi.hoisted(() => vi.fn());

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		warn,
	})),
}));

function createAxiosError(code: string, status = 400, error = code, extraData: Record<string, unknown> = {}) {
	return new axios.AxiosError(error, undefined, undefined, undefined, {
		status,
		statusText: error,
		headers: {},
		config: { headers: axios.AxiosHeaders.from({}) },
		data: { code, error, ...extraData },
	});
}

describe('handleLicenseApiError', () => {
	beforeEach(() => {
		warn.mockReset();
	});

	test('maps binding mismatch to a dedicated Directus error', () => {
		expect(() => handleLicenseApiError(createAxiosError('BINDING_MISMATCH', 409))).toThrow(BindingMismatchError);
	});

	test('maps bound, expired, and canceled license states to dedicated Directus errors', () => {
		expect(() => handleLicenseApiError(createAxiosError('LICENSE_BOUND', 409))).toThrow(LicenseBoundError);
		expect(() => handleLicenseApiError(createAxiosError('LICENSE_EXPIRED', 403))).toThrow(LicenseExpiredError);
		expect(() => handleLicenseApiError(createAxiosError('LICENSE_CANCELED', 403))).toThrow(LicenseCanceledError);
	});

	test('maps billing mutation failures to dedicated Directus errors', () => {
		expect(() => handleLicenseApiError(createAxiosError('SUBSCRIPTION_PAST_DUE', 403))).toThrow(
			SubscriptionPastDueError,
		);

		expect(() => handleLicenseApiError(createAxiosError('ADDON_NOT_ALLOWED', 403))).toThrow(AddonNotAllowedError);
		expect(() => handleLicenseApiError(createAxiosError('NO_PAYMENT_METHOD', 402))).toThrow(NoPaymentMethodError);
		expect(() => handleLicenseApiError(createAxiosError('SEAT_OVERFLOW', 409))).toThrow(SeatOverflowError);

		expect(() => handleLicenseApiError(createAxiosError('BILLING_LINKAGE_MISSING', 409))).toThrow(
			BillingLinkageMissingError,
		);
	});

	test('preserves remediation metadata for billing errors', () => {
		try {
			handleLicenseApiError(
				createAxiosError('NO_PAYMENT_METHOD', 402, 'NO_PAYMENT_METHOD', {
					setup_url: 'https://checkout.stripe.com/c/pay/cs_test_setup_addon',
					setup_url_expires_at: '2026-04-16T12:00:00.000Z',
				}),
			);
		} catch (error) {
			expect(error).toBeInstanceOf(NoPaymentMethodError);
			if (!(error instanceof NoPaymentMethodError)) throw error;

			expect(error.extensions).toMatchObject({
				setup_url: 'https://checkout.stripe.com/c/pay/cs_test_setup_addon',
				setup_url_expires_at: '2026-04-16T12:00:00.000Z',
			});
		}
	});

	test('logs unknown forbidden responses with sanitized fields', () => {
		expect(() => handleLicenseApiError(createAxiosError('MYSTERY_FORBIDDEN', 403))).toThrow();

		expect(warn).toHaveBeenCalledWith(
			{
				code: 'MYSTERY_FORBIDDEN',
				status: 403,
			},
			'[license] Received unknown forbidden response from licensing service',
		);
	});
});
