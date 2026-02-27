import { describe, expect, test } from 'vitest';
import { collectRateLimit } from './rate-limit.js';

describe('collectRateLimit', () => {
	test('returns all false by default', () => {
		expect(collectRateLimit({})).toEqual({
			enabled: false,
			pressure: false,
			email: false,
			email_flows: false,
		});
	});

	test('returns configured values', () => {
		expect(collectRateLimit({
			RATE_LIMITER_ENABLED: true,
			PRESSURE_LIMITER_ENABLED: true,
			RATE_LIMITER_EMAIL_ENABLED: true,
			RATE_LIMITER_EMAIL_FLOWS_ENABLED: false,
		})).toEqual({
			enabled: true,
			pressure: true,
			email: true,
			email_flows: false,
		});
	});
});
