import { defaults } from '@directus/utils';
import type { IntervalHistogram } from 'node:perf_hooks';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { memoryUsage } from 'node:process';
import { setTimeout } from 'node:timers';

export type PressureMonitorOptions = {
	maxEventLoopDelay?: number | false;
	maxEventLoopUtilization?: number | false;
	maxMemoryHeapUsed?: number | false;
	maxMemoryRss?: number | false;
	sampleInterval?: number;
	resolution?: number;
};

export class PressureMonitor {
	private memoryHeapUsed = 0;
	private memoryRss = 0;
	private eventLoopDelay = 0;
	private eventLoopUtilization = 0;
	private options: Required<PressureMonitorOptions>;
	private histogram: IntervalHistogram;
	private timeout: NodeJS.Timeout;

	constructor(options: PressureMonitorOptions = {}) {
		this.options = defaults(options, {
			sampleInterval: 250,
			resolution: 10,
			maxMemoryHeapUsed: false,
			maxMemoryRss: false,
			maxEventLoopDelay: false,
			maxEventLoopUtilization: false,
		});

		this.histogram = monitorEventLoopDelay({ resolution: this.options.resolution });
		this.histogram.enable();

		this.updateUsage = this.updateUsage.bind(this);
		this.timeout = setTimeout(this.updateUsage, this.options.sampleInterval);
		this.timeout.unref();
	}

	get overloaded() {
		if (this.options.maxMemoryHeapUsed && this.memoryHeapUsed > this.options.maxMemoryHeapUsed) {
			return true;
		}

		if (this.options.maxMemoryRss && this.memoryRss > this.options.maxMemoryRss) {
			return true;
		}

		if (this.options.maxEventLoopDelay && this.eventLoopDelay > this.options.maxEventLoopDelay) {
			return true;
		}

		if (this.options.maxEventLoopUtilization && this.eventLoopUtilization > this.options.maxEventLoopUtilization) {
			return true;
		}

		return false;
	}

	private updateUsage() {
		this.updateMemoryUsage();
		this.updateEventLoopUsage();
		this.timeout.refresh();
	}

	private updateMemoryUsage() {
		const { heapUsed, rss } = memoryUsage();
		this.memoryHeapUsed = heapUsed;
		this.memoryRss = rss;
	}

	private updateEventLoopUsage() {
		this.eventLoopUtilization = performance.eventLoopUtilization().utilization;
		// histogram is in nanoseconds. 1 nanosecond = 1e6 milliseconds
		this.eventLoopDelay = Math.round(this.histogram.mean / 1e6);
		this.histogram.reset();
	}
}
