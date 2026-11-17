import type { DirectusError } from '@directus/errors';
import { ErrorCode, isDirectusError, LicenseInvalidError } from '@directus/errors';
import type { InvalidLicenseStatus } from '@directus/license';
import { LicenseServerError } from '@directus/license';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { isActivationMissing, toReason, translateLicenseError } from './errors.js';

const warn = vi.fn();

vi.mock('../../logger/index.js', () => ({
	useLogger: () => ({ warn }),
}));

function serverError(code: string, extensions?: Record<string, unknown>, status = 400) {
	return new LicenseServerError({ message: 'Upstream detail', code, status, extensions });
}

/** Translate the error and assert on the error it maps to */
function expectThrows(error: unknown, code: ErrorCode): DirectusError<unknown> {
	const thrown = translateLicenseError(error);

	expect(isDirectusError(thrown, code), `expected ${code}, got ${thrown}`).toBe(true);

	return thrown as DirectusError<unknown>;
}

describe('translateLicenseError', () => {
	describe('the key cannot be used here', () => {
		test.each([
			['LICENSE_EXPIRED', 'expired', 'The license has expired'],
			['LICENSE_CANCELED', 'canceled', 'The license has been canceled'],
			['LICENSE_SUSPENDED', 'suspended', 'The license has been suspended'],
			['INVALID_CREDENTIALS', 'invalid_key', 'The license key is not valid'],
			['LICENSE_NOT_FOUND', 'invalid_key', 'The license key is not valid'],
			['ACTIVATION_LIMIT_EXCEEDED', 'activation_limit', 'The license has reached its activation limit'],
			['BINDING_MISMATCH', 'binding_mismatch', 'The license key is bound to another project'],
			['REPLACEMENT_BINDING_MISMATCH', 'binding_mismatch', 'The license key is bound to another project'],
		])('%s throws LicenseInvalidError carrying the %s discriminant', (code, failure, reason) => {
			const thrown = expectThrows(serverError(code), ErrorCode.LicenseInvalid);

			expect(thrown.message).toBe(`License key cannot be applied. ${reason}`);
			expect(thrown.extensions).toEqual({ failure, reason });
		});
	});

	describe('the request cannot be applied as sent', () => {
		test.each([
			serverError('INVALID_PAYLOAD'),
			serverError('LIMIT_OVERFLOW'),
			serverError('UNSUPPORTED_MEDIA_TYPE'),
			serverError('NOT_FOUND', undefined, 404),
			serverError('SOMETHING_NEW', undefined, 422),
		])('$code throws InvalidPayloadError', (error) => {
			expectThrows(error, ErrorCode.InvalidPayload);
		});

		test('passes the upstream reason through', () => {
			const error = new LicenseServerError({
				message: 'Addon seats quantity exceeds maximum of 10',
				code: 'INVALID_PAYLOAD',
				status: 400,
			});

			const thrown = expectThrows(error, ErrorCode.InvalidPayload);

			expect(thrown.message).toBe('Invalid payload. Addon seats quantity exceeds maximum of 10.');
			expect(thrown.extensions).toEqual({ reason: 'Addon seats quantity exceeds maximum of 10' });
		});

		test('drops a trailing period from the upstream reason', () => {
			const error = new LicenseServerError({ message: 'Bad request.', code: 'INVALID_PAYLOAD', status: 400 });

			expect(expectThrows(error, ErrorCode.InvalidPayload).message).toBe('Invalid payload. Bad request.');
		});

		test('falls back when the upstream reason is empty', () => {
			const error = new LicenseServerError({ message: '', code: 'INVALID_PAYLOAD', status: 400 });

			expect(expectThrows(error, ErrorCode.InvalidPayload).message).toBe(
				'Invalid payload. The licensing service rejected the request.',
			);
		});
	});

	describe('the subscription does not allow the operation', () => {
		test.each([
			serverError('FORBIDDEN'),
			serverError('SUBSCRIPTION_PAST_DUE'),
			serverError('NO_PAYMENT_METHOD'),
			serverError('BILLING_LINKAGE_MISSING'),
			serverError('ADDON_NOT_ALLOWED'),
			serverError('SOMETHING_NEW', undefined, 403),
		])('$code throws ForbiddenError', (error) => {
			const thrown = expectThrows(error, ErrorCode.Forbidden);
			expect(thrown.message).toBe(`You don't have permission to access this.`);
		});
	});

	describe('the service failed us', () => {
		test.each([
			serverError('OPERATION_IN_PROGRESS'),
			serverError('CACHE_STALE'),
			serverError('SERVICE_UNAVAILABLE'),
			serverError('ROUTE_NOT_FOUND'),
			serverError('INTERNAL_SERVER_ERROR'),
			serverError('CONFLICT'),
			serverError('SOMETHING_NEW', undefined, 500),
		])('$code throws ServiceUnavailableError', (error) => {
			const thrown = expectThrows(error, ErrorCode.ServiceUnavailable);
			expect(thrown.message).toBe('Service "license" is unavailable. The licensing service could not be reached.');
		});
	});

	describe('leaves errors from outside the license server alone', () => {
		test.each([new Error('socket hang up'), 'nope'])('%s is returned as is', (error) => {
			expect(translateLicenseError(error)).toBe(error);
		});
	});

	describe('throttled', () => {
		beforeEach(() => {
			vi.useFakeTimers({ now: 1_735_689_600_000 });
			return () => vi.useRealTimers();
		});

		test('carries the limit and reset through', () => {
			const thrown = expectThrows(
				serverError('REQUESTS_EXCEEDED', { limit: 25, retry_after: 60 }),
				ErrorCode.RequestsExceeded,
			);

			expect(thrown.extensions).toEqual({ limit: 25, reset: new Date('2025-01-01T00:01:00Z') });
		});

		test('falls back when the server omits them', () => {
			const thrown = expectThrows(serverError('REQUESTS_EXCEEDED'), ErrorCode.RequestsExceeded);

			expect(thrown.extensions).toEqual({ limit: 0, reset: new Date('2025-01-01T00:00:01Z') });
		});

		test('an unknown code with a 429 status is throttled', () => {
			expectThrows(serverError('SOMETHING_NEW', undefined, 429), ErrorCode.RequestsExceeded);
		});
	});

	describe('keeps the upstream error out of the other responses', () => {
		test.each([
			[serverError('LICENSE_EXPIRED'), ErrorCode.LicenseInvalid],
			[serverError('FORBIDDEN'), ErrorCode.Forbidden],
			[serverError('REQUESTS_EXCEEDED'), ErrorCode.RequestsExceeded],
			[serverError('SERVICE_UNAVAILABLE'), ErrorCode.ServiceUnavailable],
		])('%s is logged, not sent', (error, code) => {
			const thrown = expectThrows(error, code);

			expect(warn).toHaveBeenCalledWith(error, expect.any(String));
			expect(thrown.message).not.toContain('Upstream detail');
			expect(JSON.stringify(thrown.extensions ?? {})).not.toContain('Upstream detail');
		});
	});
});

describe('isActivationMissing', () => {
	test.each(['INVALID_CREDENTIALS', 'LICENSE_NOT_FOUND', 'BINDING_MISMATCH'])(
		'%s means the activation is missing',
		(code) => {
			expect(isActivationMissing(serverError(code))).toBe(true);
		},
	);

	test.each([
		'LICENSE_EXPIRED',
		'LICENSE_CANCELED',
		'ACTIVATION_LIMIT_EXCEEDED',
		'SERVICE_UNAVAILABLE',
		'FORBIDDEN',
		'NOT_FOUND',
		'REPLACEMENT_BINDING_MISMATCH',
	])('%s leaves the activation in place', (code) => {
		expect(isActivationMissing(serverError(code))).toBe(false);
	});

	test('an error from outside the license server leaves the activation in place', () => {
		expect(isActivationMissing(new Error('socket hang up'))).toBe(false);
	});
});

describe('toReason', () => {
	describe('reports the license fault', () => {
		test.each([
			['LICENSE_EXPIRED', 'expired'],
			['LICENSE_CANCELED', 'canceled'],
			['LICENSE_SUSPENDED', 'suspended'],
			['INVALID_CREDENTIALS', 'invalid_key'],
			['LICENSE_NOT_FOUND', 'invalid_key'],
			['ACTIVATION_LIMIT_EXCEEDED', 'activation_limit'],
			['BINDING_MISMATCH', 'binding_mismatch'],
			['REPLACEMENT_BINDING_MISMATCH', 'binding_mismatch'],
		] satisfies [string, InvalidLicenseStatus][])('%s reads as %s', (code, reason) => {
			expect(toReason(serverError(code))).toBe(reason);
		});

		test('reads the failure off a translated LicenseInvalidError', () => {
			expect(
				toReason(new LicenseInvalidError({ failure: 'suspended', reason: 'The license has been suspended' })),
			).toBe('suspended');
		});
	});

	describe('reports what says nothing about the license as unavailable', () => {
		test.each([
			'SUBSCRIPTION_PAST_DUE',
			'NO_PAYMENT_METHOD',
			'BILLING_LINKAGE_MISSING',
			'FORBIDDEN',
			'ADDON_NOT_ALLOWED',
			'INVALID_PAYLOAD',
			'LIMIT_OVERFLOW',
			'NOT_FOUND',
			'REQUESTS_EXCEEDED',
			'OPERATION_IN_PROGRESS',
			'CACHE_STALE',
			'ROUTE_NOT_FOUND',
		])('%s reads as unavailable', (code) => {
			expect(toReason(serverError(code))).toBe('unavailable');
		});

		test.each([400, 401, 403, 429, 500])('an unknown code with status %s reads as unavailable', (status) => {
			expect(toReason(serverError('SOMETHING_NEW', undefined, status))).toBe('unavailable');
		});

		test('an unreachable service reads as unavailable', () => {
			expect(toReason(new Error('socket hang up'))).toBe('unavailable');
		});

		test('every downgrade gets a reason', () => {
			expect(toReason('nope')).toBe('unavailable');
		});
	});
});
