import { describe, expect, test } from 'vitest';
import { collectFlowsConfig } from './flows.js';

describe('collectFlowsConfig', () => {
	test('returns null for unset limits', () => {
		expect(collectFlowsConfig({})).toStrictEqual({ run_script_timeout: null, run_script_max_memory: null });
	});

	test('reads configured limits', () => {
		expect(collectFlowsConfig({ FLOWS_RUN_SCRIPT_TIMEOUT: 10000, FLOWS_RUN_SCRIPT_MAX_MEMORY: '32' })).toStrictEqual({
			run_script_timeout: 10000,
			run_script_max_memory: '32',
		});
	});
});
