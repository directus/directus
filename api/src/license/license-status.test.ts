import { describe, expect, test, vi } from 'vitest';
import { getDerivedLicenseStatus } from './license-status.js';

describe('getDerivedLicenseStatus', () => {
	test('treats past_due payloads as expiration grace', () => {
		expect(
			getDerivedLicenseStatus({
				durableStatus: 'active',
				payloadStatus: 'past_due',
				hasValidPayload: true,
			}),
		).toEqual({
			status: 'grace',
			locked: false,
			graceType: 'expiration',
		});
	});

	test('treats expired payloads inside grace as expiration grace', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-07T12:00:00.000Z'));

		expect(
			getDerivedLicenseStatus({
				durableStatus: 'active',
				payloadStatus: 'expired',
				tokenExpiresAt: Math.floor(Date.parse('2026-04-06T12:00:00.000Z') / 1000),
				gracePeriod: 2 * 24 * 60 * 60,
				hasValidPayload: true,
			}),
		).toEqual({
			status: 'grace',
			locked: false,
			graceType: 'expiration',
		});

		vi.useRealTimers();
	});

	test('locks expired payloads after grace elapses', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));

		expect(
			getDerivedLicenseStatus({
				durableStatus: 'active',
				payloadStatus: 'expired',
				tokenExpiresAt: Math.floor(Date.parse('2026-04-06T12:00:00.000Z') / 1000),
				gracePeriod: 2 * 24 * 60 * 60,
				hasValidPayload: true,
			}),
		).toEqual({
			status: 'locked',
			locked: true,
			graceType: null,
		});

		vi.useRealTimers();
	});
});
