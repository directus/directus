import { describe, expect, test } from 'vitest';
import { collectAi } from './ai.js';

describe('collectAi', () => {
	test('defaults everything off with no provider', () => {
		expect(collectAi({})).toStrictEqual({
			enabled: false,
			devtools: false,
			telemetry: { enabled: false, provider: null },
		});
	});

	test('reads the configured flags and provider', () => {
		expect(
			collectAi({
				AI_ENABLED: true,
				AI_DEVTOOLS_ENABLED: true,
				AI_TELEMETRY_ENABLED: true,
				AI_TELEMETRY_PROVIDER: 'langfuse',
			}),
		).toStrictEqual({ enabled: true, devtools: true, telemetry: { enabled: true, provider: 'langfuse' } });
	});
});
