import { randomInteger } from '@directus/random';
import type { EventLoopUtilization, IntervalHistogram } from 'node:perf_hooks';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { memoryUsage } from 'node:process';
import { setTimeout } from 'node:timers';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PressureMonitorOptions } from './monitor.js';
import { PressureMonitor } from './monitor.js';

vi.mock('node:perf_hooks');
vi.mock('node:timers');
vi.mock('node:process');

let monitor: PressureMonitor;
let mockIntervalHistogram: IntervalHistogram;
let mockTimer: NodeJS.Timeout;

let sample: {
	config: Required<PressureMonitorOptions>;
	rss: number;
	heapUsed: number;
	eventLoopUtilization: number;
	meanEventLoopDelay: number;
};

beforeEach(() => {
	sample = {
		config: {
			sampleInterval: randomInteger(100, 2500),
			resolution: randomInteger(10, 25),
			maxMemoryHeapUsed: randomInteger(1e6, 1e9),
			maxMemoryRss: randomInteger(1e6, 1e9),
			maxEventLoopDelay: randomInteger(100, 1000),
			maxEventLoopUtilization: randomInteger(2, 99) / 100,
		},
		rss: randomInteger(1e6, 1e9),
		heapUsed: randomInteger(1e6, 1e9),
		eventLoopUtilization: randomInteger(2, 99) / 100,
		meanEventLoopDelay: randomInteger(50 * 1e6, 250 * 1e6),
	};

	mockIntervalHistogram = {
		enable: vi.fn(),
		disable: vi.fn(),
		reset: vi.fn(),
		mean: sample.meanEventLoopDelay,
	} as unknown as IntervalHistogram;

	mockTimer = {
		refresh: vi.fn(),
		unref: vi.fn(),
	} as unknown as NodeJS.Timeout;

	vi.mocked(setTimeout).mockReturnValue(mockTimer);
	vi.mocked(monitorEventLoopDelay).mockReturnValue(mockIntervalHistogram);

	monitor = new PressureMonitor(sample.config);
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('#constructor', () => {
	test('Defaults the options', () => {
		monitor = new PressureMonitor();

		expect(monitor['options']).toEqual({
			sampleInterval: 250,
			resolution: 10,
			maxMemoryHeapUsed: false,
			maxMemoryRss: false,
			maxEventLoopDelay: false,
			maxEventLoopUtilization: false,
		});
	});

	test('Creates histogram', () => {
		expect(monitorEventLoopDelay).toHaveBeenCalledWith({ resolution: sample.config.resolution });
		expect(monitor['histogram']).toBe(mockIntervalHistogram);
		expect(mockIntervalHistogram.enable).toHaveBeenCalledOnce();
	});

	test('Starts a timeout', () => {
		expect(setTimeout).toHaveBeenCalledOnce();
		expect(setTimeout).toHaveBeenCalledWith(monitor['updateUsage'], sample.config.sampleInterval);
		expect(monitor['timeout']).toBe(mockTimer);
		expect(mockTimer.unref).toHaveBeenCalledOnce();
	});
});

describe('#overloaded', () => {
	test('Returns false if all settings are false', () => {
		monitor = new PressureMonitor({
			maxMemoryHeapUsed: false,
			maxMemoryRss: false,
			maxEventLoopDelay: false,
			maxEventLoopUtilization: false,
		});

		expect(monitor.overloaded).toBe(false);
	});

	test('Returns true if mem heap used exceeds threshold', () => {
		monitor['memoryHeapUsed'] = (sample.config.maxMemoryHeapUsed as number) + 1;
		expect(monitor.overloaded).toBe(true);
	});

	test('Returns true if mem rss exceeds threshold', () => {
		monitor['memoryRss'] = (sample.config.maxMemoryRss as number) + 1;
		expect(monitor.overloaded).toBe(true);
	});

	test('Returns true if event loop delay exceeds threshold', () => {
		monitor['eventLoopDelay'] = (sample.config.maxEventLoopDelay as number) + 1;
		expect(monitor.overloaded).toBe(true);
	});

	test('Returns true if event utilization exceeds threshold', () => {
		monitor['eventLoopUtilization'] = (sample.config.maxEventLoopUtilization as number) + 1;
		expect(monitor.overloaded).toBe(true);
	});
});

describe('#updateUsage', () => {
	beforeEach(() => {
		monitor['updateMemoryUsage'] = vi.fn();
		monitor['updateEventLoopUsage'] = vi.fn();
		monitor['updateUsage']();
	});

	test('Calls updateMemoryUsage', () => {
		expect(monitor['updateMemoryUsage']).toHaveBeenCalledOnce();
	});

	test('Calls updateEventLoopUsage', () => {
		expect(monitor['updateEventLoopUsage']).toHaveBeenCalledOnce();
	});

	test('Refreshes the timer', () => {
		expect(mockTimer.refresh).toHaveBeenCalledOnce();
	});
});

describe('#updateMemoryUsage', () => {
	beforeEach(() => {
		vi.mocked(memoryUsage).mockReturnValue({ rss: sample.rss, heapUsed: sample.heapUsed } as NodeJS.MemoryUsage);
		monitor['updateMemoryUsage']();
	});

	test('Gets heapUsed and rss from memoryUsage', () => {
		expect(memoryUsage).toHaveBeenCalledOnce();
	});

	test('Saves memoryUsage and rss', () => {
		expect(monitor['memoryHeapUsed']).toBe(sample.heapUsed);
		expect(monitor['memoryRss']).toBe(sample.rss);
	});
});

describe('#updateEventLoopsUsage', () => {
	beforeEach(() => {
		vi.spyOn(performance, 'eventLoopUtilization').mockReturnValue({
			utilization: sample.eventLoopUtilization,
		} as EventLoopUtilization);

		monitor['updateEventLoopUsage']();
	});

	test('Sets eventLoopUtilization based on perf output', () => {
		expect(performance.eventLoopUtilization).toHaveBeenCalledOnce();
		expect(monitor['eventLoopUtilization']).toBe(sample.eventLoopUtilization);
	});

	test('Sets eventLoopDelay based on histogram mean', () => {
		expect(monitor['eventLoopDelay']).toBe(Math.round(sample.meanEventLoopDelay / 1e6));
	});

	test('Resets the histogram interval', () => {
		expect(mockIntervalHistogram.reset).toHaveBeenCalledOnce();
	});
});
