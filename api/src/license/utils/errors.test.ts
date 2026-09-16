import type { DirectusError } from '@directus/errors';
import { ErrorCode, isDirectusError } from '@directus/errors';
import type { InvalidLicenseStatus } from '@directus/license';
import { LicenseServerError } from '@directus/license';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { handleLicenseError, toReason } from './errors.js';

function serverError(code: string, extensions?: Record<string, unknown>) {
	return new LicenseServerError({ message: 'Upstream detail', code, extensions });
}

/** Run the handler and assert on the error it maps to */
function expectThrows(error: unknown, code: ErrorCode): DirectusError<unknown> {
	try {
		handleLicenseError(error);
	} catch (thrown) {
		expect(isDirectusError(thrown, code), `expected ${code}, got ${thrown}`).toBe(true);
		return thrown as DirectusError<unknown>;
	}
}

describe('handleLicenseError', () => {
	describe('the key cannot be used here', () => {
		test.each([
			['LICENSE_EXPIRED', 'expired'],
			['LICENSE_CANCELED', 'canceled'],
			['LICENSE_SUSPENDED', 'suspended'],
			['INVALID_CREDENTIALS', 'invalid_key'],
			['NOT_FOUND', 'invalid_key'],
			['INVALID_PAYLOAD', 'invalid_key'],
			['ACTIVATION_LIMIT_EXCEEDED', 'activation_limit'],
			['BINDING_MISMATCH', 'binding_mismatch'],
		])('%s throws LicenseInvalidError carrying the %s discriminant', (code, failure) => {
			const thrown = expectThrows(serverError(code), ErrorCode.LicenseInvalid);

			expect(thrown.message).toBe('License key cannot be applied. Upstream detail');
			expect(thrown.extensions).toEqual({ failure, reason: 'Upstream detail' });
		});
	});

	describe('the request cannot be applied as sent', () => {
		test.each(['LIMIT_OVERFLOW'])('%s throws InvalidPayloadError', (code) => {
			const thrown = expectThrows(serverError(code), ErrorCode.InvalidPayload);
			expect(thrown.message).toBe('Invalid payload. Upstream detail.');
		});
	});

	describe('the subscription does not allow the operation', () => {
		test.each([
			'FORBIDDEN',
			'SUBSCRIPTION_PAST_DUE',
			'NO_PAYMENT_METHOD',
			'BILLING_LINKAGE_MISSING',
			'ADDON_NOT_ALLOWED',
		])('%s throws ForbiddenError', (code) => {
			const thrown = expectThrows(serverError(code), ErrorCode.Forbidden);
			expect(thrown.message).toBe('Upstream detail');
		});
	});

	describe('the service failed us', () => {
		// The license client exhausts its own retries on the transient codes before they reach us
		test.each(['OPERATION_IN_PROGRESS', 'CACHE_STALE', 'SERVICE_UNAVAILABLE', 'ROUTE_NOT_FOUND', 'SOMETHING_NEW'])(
			'%s throws LicenseServiceUnavailableError',
			(code) => {
				const thrown = expectThrows(serverError(code), ErrorCode.LicenseServiceUnavailable);
				expect(thrown.message).toBe('Licensing service is unreachable. Upstream detail');
			},
		);

		test('a transport failure throws LicenseServiceUnavailableError', () => {
			const thrown = expectThrows(new Error('socket hang up'), ErrorCode.LicenseServiceUnavailable);
			expect(thrown.message).toBe('Licensing service is unreachable. socket hang up');
		});

		test('a non-error throws LicenseServiceUnavailableError', () => {
			const thrown = expectThrows('nope', ErrorCode.LicenseServiceUnavailable);
			expect(thrown.message).toBe('Licensing service is unreachable. An unknown error occurred');
		});
	});

	describe('throttled', () => {
		beforeEach(() => {
			vi.useFakeTimers({ now: 1_735_689_600_000 }); // 2025-01-01T00:00:00Z
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
	});
});

describe('toReason', () => {
	describe('reports the license fault', () => {
		test.each([
			['LICENSE_EXPIRED', 'expired'],
			['LICENSE_CANCELED', 'canceled'],
			['LICENSE_SUSPENDED', 'suspended'],
			['INVALID_CREDENTIALS', 'invalid_key'],
			['NOT_FOUND', 'invalid_key'],
			['INVALID_PAYLOAD', 'invalid_key'],
			['ACTIVATION_LIMIT_EXCEEDED', 'activation_limit'],
			['BINDING_MISMATCH', 'binding_mismatch'],
		] satisfies [string, InvalidLicenseStatus][])('%s reads as %s', (code, reason) => {
			expect(toReason(serverError(code))).toBe(reason);
		});
	});

	describe('reports what says nothing about the license as unavailable', () => {
		test.each([
			'FORBIDDEN',
			'SUBSCRIPTION_PAST_DUE',
			'ADDON_NOT_ALLOWED',
			'LIMIT_OVERFLOW',
			'REQUESTS_EXCEEDED',
			'OPERATION_IN_PROGRESS',
			'CACHE_STALE',
			'ROUTE_NOT_FOUND',
		])('%s reads as unavailable', (code) => {
			expect(toReason(serverError(code))).toBe('unavailable');
		});

		test('an unreachable service reads as unavailable', () => {
			expect(toReason(new Error('socket hang up'))).toBe('unavailable');
		});

		test('every downgrade gets a reason', () => {
			expect(toReason('nope')).toBe('unavailable');
		});
	});
});
