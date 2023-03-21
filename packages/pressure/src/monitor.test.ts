import { PressureMonitor } from './monitor.js';
import { vi, test, beforeEach, afterEach, describe, expect } from 'vitest';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import type { IntervalHistogram } from 'node:perf_hooks';
import { setTimeout } from 'node:timers';

vi.mock('node:perf_hooks');
vi.mock('node:timers');

let mockIntervalHistogram: IntervalHistogram;
let mockTimer: NodeJS.Timeout;

beforeEach(() => {
	mockIntervalHistogram = {
		enable: vi.fn(),
		disable: vi.fn(),
	} as unknown as IntervalHistogram;

	mockTimer = {
		refresh: vi.fn(),
		unref: vi.fn(),
	} as unknown as NodeJS.Timeout;

	vi.mocked(setTimeout).mockReturnValue(mockTimer);
	vi.mocked(monitorEventLoopDelay).mockReturnValue(mockIntervalHistogram);
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('#constructor', () => {
	let monitor: PressureMonitor;

	test('Defaults the options', () => {
		monitor = new PressureMonitor();

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
		monitor = new PressureMonitor();
	});
});
