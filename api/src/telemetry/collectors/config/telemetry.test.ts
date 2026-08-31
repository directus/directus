import { describe, expect, test } from 'vitest';
import { collectTelemetryConfig } from './telemetry.js';

describe('collectTelemetryConfig', () => {
	test('defaults both to enabled when unset', () => {
		expect(collectTelemetryConfig({})).toStrictEqual({ enabled: true, project_owner: true });
	});

	test('reports an instance reporting despite telemetry being switched off', () => {
		expect(collectTelemetryConfig({ TELEMETRY: false, PROJECT_OWNER_ENABLED: false })).toStrictEqual({
			enabled: false,
			project_owner: false,
		});
	});
});
