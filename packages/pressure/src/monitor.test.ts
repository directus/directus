import { PressureMonitor } from './monitor.js';
import { vi, test, beforeEach, afterEach, describe, expect } from 'vitest';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

vi.mock('node:perf_hooks');

describe('#constructor', () => {
	let monitor: PressureMonitor;

	afterEach(() => {
		monitor?.destroy();
	});

	test('Defaults the options', () => {
		monitor = new PressureMonitor({});

		expect(monitor['options']).toEqual({
			sampleInterval: 1000,
			resolution: 10,
			maxMemoryHeapUsed: false,
			maxMemoryRss: false,
			maxEventLoopDelay: false,
			maxEventLoopUtilization: false,
		});
	});

	test('Creates histogram', () => {
		monitor = new PressureMonitor({});
	});
});
