import { describe, expect, test } from 'vitest';
import { collectPrometheus } from './prometheus.js';

describe('collectPrometheus', () => {
	test('returns enabled false by default', () => {
		expect(collectPrometheus({})).toEqual({ enabled: false });
	});

	test('returns enabled true when METRICS_ENABLED is true', () => {
		expect(collectPrometheus({ METRICS_ENABLED: true })).toEqual({ enabled: true });
	});
});
