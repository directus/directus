import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { defaults } from 'lodash-es';
import type { EventLoopUtilization, IntervalHistogram } from 'node:perf_hooks';

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
	private elu: EventLoopUtilization;
	private timeout: NodeJS.Timeout;

	constructor(options: PressureMonitorOptions) {
		this.options = defaults(options, {
			sampleInterval: 1000,
			resolution: 10,
			maxMemoryHeapUsed: false,
			maxMemoryRss: false,
			maxEventLoopDelay: false,
			maxEventLoopUtilization: false,
		} as Required<PressureMonitorOptions>);

		this.histogram = monitorEventLoopDelay({ resolution: this.options.resolution });
		this.histogram.enable();

		this.elu = performance.eventLoopUtilization();
		this.timeout = setTimeout(this.updateUsage, options.sampleInterval);
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
		const { heapUsed, rss } = process.memoryUsage();
		this.memoryHeapUsed = heapUsed;
		this.memoryRss = rss;
	}

	private updateEventLoopUsage() {
		this.eventLoopUtilization = performance.eventLoopUtilization(this.elu).utilization;
		this.eventLoopDelay = Math.max(this.histogram.mean / 1_000_000 - this.options.resolution, 0);

		if (Number.isNaN(this.eventLoopDelay)) {
			this.eventLoopDelay = Infinity;
		}

		this.histogram.reset();
	}
}
