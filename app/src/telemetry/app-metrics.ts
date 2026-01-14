import type { Attributes, Counter, Histogram, ObservableGauge, ObservableResult } from '@opentelemetry/api';
import { getMeter } from '../telemetry';

let meter: ReturnType<typeof getMeter> | null = null;

// Counters
let apiRequestCounter: Counter<Attributes> | undefined;
let apiErrorCounter: Counter<Attributes> | undefined;
let userActionCounter: Counter<Attributes> | undefined;
let navigationCounter: Counter<Attributes> | undefined;

// Histograms
let apiDurationHistogram: Histogram<Attributes> | undefined;
let renderTimeHistogram: Histogram<Attributes> | undefined;

// Gauges (Observable Gauges)
let memoryUsageGauge: ObservableGauge | undefined;

/**
 * Initialize custom Directus app metrics
 */
export function initAppMetrics() {
	meter = getMeter('directus-app-custom');

	if (!meter) {
		console.warn('OpenTelemetry meter not available, custom app metrics will not be collected');
		return;
	}

	// === COUNTERS ===
	apiRequestCounter = meter.createCounter('app_api_requests_total', {
		description: 'Total number of API requests made by the app',
		unit: '1',
	});

	apiErrorCounter = meter.createCounter('app_api_errors_total', {
		description: 'Total number of API errors encountered',
		unit: '1',
	});

	userActionCounter = meter.createCounter('app_user_actions_total', {
		description: 'Total number of user actions (clicks, interactions)',
		unit: '1',
	});

	navigationCounter = meter.createCounter('app_navigations_total', {
		description: 'Total number of route navigations',
		unit: '1',
	});

	// === HISTOGRAMS ===
	apiDurationHistogram = meter.createHistogram('app_api_request_duration', {
		description: 'Duration of API requests',
		unit: 'ms',
	});

	renderTimeHistogram = meter.createHistogram('app_component_render_time', {
		description: 'Component render time',
		unit: 'ms',
	});

	// === OBSERVABLE GAUGES ===
	memoryUsageGauge = meter.createObservableGauge('app_memory_usage_bytes', {
		description: 'JavaScript heap memory usage',
		unit: 'bytes',
	});

	memoryUsageGauge.addCallback((observableResult: ObservableResult) => {
		if ('memory' in performance && performance.memory) {
			const memory = performance.memory as {
				usedJSHeapSize: number;
				totalJSHeapSize: number;
				jsHeapSizeLimit: number;
			};

			observableResult.observe(memory.usedJSHeapSize, {
				'memory.type': 'used_heap',
			});

			observableResult.observe(memory.totalJSHeapSize, {
				'memory.type': 'total_heap',
			});

			observableResult.observe(memory.jsHeapSizeLimit, {
				'memory.type': 'heap_limit',
			});
		}
	});

	console.log('[App Metrics] Custom metrics initialized');
}

/**
 * Record an API request
 */
export function recordApiRequest(
	endpoint: string,
	method: string,
	statusCode: number,
	duration: number,
	error?: string,
) {
	const attributes = {
		'http.endpoint': endpoint,
		'http.method': method,
		'http.status_code': statusCode,
	};

	apiRequestCounter?.add(1, attributes);

	if (statusCode >= 400 || error) {
		apiErrorCounter?.add(1, {
			...attributes,
			'error.type': error || 'http_error',
		});
	}

	apiDurationHistogram?.record(duration, attributes);
}

/**
 * Record a user action
 */
export function recordUserAction(action: string, target?: string, metadata?: Record<string, string>) {
	userActionCounter?.add(1, {
		'action.type': action,
		'action.target': target || 'unknown',
		...metadata,
	});
}

/**
 * Record a route navigation
 */
export function recordNavigation(from: string, to: string) {
	navigationCounter?.add(1, {
		'navigation.from': from,
		'navigation.to': to,
	});
}

/**
 * Record component render time
 */
export function recordRenderTime(componentName: string, duration: number) {
	renderTimeHistogram?.record(duration, {
		'component.name': componentName,
	});
}
