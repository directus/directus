import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { Resource } from '@opentelemetry/resources';
import {
	BatchLogRecordProcessor,
	ConsoleLogRecordExporter,
	LoggerProvider,
	SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

let loggerProvider: LoggerProvider | null = null;
let meterProvider: MeterProvider | null = null;

export function initTelemetry() {
	// Check if enabled via env var (injected by Vite)
	if (import.meta.env.VITE_OPENTELEMETRY_ENABLED !== 'true') {
		return;
	}

	const baseEndpoint =
		import.meta.env.VITE_OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

	const resource = new Resource({
		[ATTR_SERVICE_NAME]: import.meta.env.VITE_OPENTELEMETRY_SERVICE_NAME || 'directus-app',
		[ATTR_SERVICE_VERSION]: 'unknown',
	});

	// ========== TRACES ==========
	const traceProvider = new WebTracerProvider({ resource });

	const traceExporter = new OTLPTraceExporter({
		url: `${baseEndpoint}/v1/traces`,
		headers: { 'Content-Type': 'application/json' },
	});

	traceProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter));

	if (import.meta.env.DEV) {
		traceProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
	}

	traceProvider.register({
		contextManager: new ZoneContextManager(),
	});

	// ========== LOGS ==========
	const logExporter = new OTLPLogExporter({
		url: `${baseEndpoint}/v1/logs`,
		headers: { 'Content-Type': 'application/json' },
	});

	loggerProvider = new LoggerProvider({ resource });
	loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

	if (import.meta.env.DEV) {
		loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()));
	}

	logs.setGlobalLoggerProvider(loggerProvider);

	// ========== METRICS ==========
	const metricExporter = new OTLPMetricExporter({
		url: `${baseEndpoint}/v1/metrics`,
		headers: { 'Content-Type': 'application/json' },
	});

	meterProvider = new MeterProvider({
		resource,
		readers: [
			new PeriodicExportingMetricReader({
				exporter: metricExporter,
				exportIntervalMillis: 60000, // Export every 60 seconds
			}),
		],
	});

	// ========== INSTRUMENTATIONS ==========
	registerInstrumentations({
		instrumentations: [
			new DocumentLoadInstrumentation(),
			new UserInteractionInstrumentation(),
			new XMLHttpRequestInstrumentation(),
			new FetchInstrumentation({
				propagateTraceHeaderCorsUrls: [
					new RegExp(import.meta.env.VITE_PUBLIC_URL || window.location.origin),
					/localhost:\d+/,
				],
			}),
		],
	});

	// Intercept console methods to send logs to OpenTelemetry
	setupConsoleInterceptor();

	// eslint-disable-next-line no-console
	console.log('OpenTelemetry initialized with traces, logs, and metrics');
}

/**
 * Get the OpenTelemetry logger for emitting structured logs
 */
export function getLogger(name = 'directus-app') {
	return logs.getLogger(name);
}

export { initWebVitals } from './telemetry/web-vitals';
export { initAppMetrics, recordApiRequest, recordUserAction, recordNavigation, recordRenderTime } from './telemetry/app-metrics';

/**
 * Get the OpenTelemetry meter for recording metrics
 */
export function getMeter(name = 'directus-app') {
	return meterProvider?.getMeter(name);
}

/**
 * Emit a log record to OpenTelemetry
 */
export function emitLog(
	severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
	body: string,
	attributes: Record<string, string | number | boolean> = {},
) {
	const logger = getLogger();
	const severityMap = {
		DEBUG: SeverityNumber.DEBUG,
		INFO: SeverityNumber.INFO,
		WARN: SeverityNumber.WARN,
		ERROR: SeverityNumber.ERROR,
	};

	logger.emit({
		severityNumber: severityMap[severity],
		severityText: severity,
		body,
		attributes: {
			...attributes,
			'browser.url': window.location.href,
			'browser.user_agent': navigator.userAgent,
		},
	});
}

/**
 * Intercept console methods and forward them to OpenTelemetry logs
 */
function setupConsoleInterceptor() {
	const originalConsole = {
		log: console.log.bind(console),
		info: console.info.bind(console),
		warn: console.warn.bind(console),
		error: console.error.bind(console),
		debug: console.debug.bind(console),
	};

	const severityMap: Record<string, 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'> = {
		log: 'INFO',
		info: 'INFO',
		warn: 'WARN',
		error: 'ERROR',
		debug: 'DEBUG',
	};

	for (const [method, severity] of Object.entries(severityMap)) {
		const originalMethod = originalConsole[method as keyof typeof originalConsole];

		(console as unknown as Record<string, (...args: unknown[]) => void>)[method] = (...args: unknown[]) => {
			// Call original console method
			originalMethod(...args);

			// Skip if this is the OpenTelemetry initialization log
			if (args[0] === 'OpenTelemetry initialized with traces, logs, and metrics') {
				return;
			}

			// Forward to OpenTelemetry
			try {
				const message = args
					.map((arg) => {
						if (typeof arg === 'object') {
							try {
								return JSON.stringify(arg);
							} catch {
								return String(arg);
							}
						}

						return String(arg);
					})
					.join(' ');

				emitLog(severity, message, { 'log.source': 'console', 'console.method': method });
			} catch {
				// Silently fail to avoid infinite loops
			}
		};
	}

	// Capture unhandled errors
	window.addEventListener('error', (event) => {
		emitLog('ERROR', event.message, {
			'error.type': 'uncaught_error',
			'error.filename': event.filename || 'unknown',
			'error.lineno': event.lineno || 0,
			'error.colno': event.colno || 0,
			'error.stack': event.error?.stack || '',
		});
	});

	// Capture unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		const reason = event.reason;
		const message = reason instanceof Error ? reason.message : String(reason);
		const stack = reason instanceof Error ? reason.stack || '' : '';

		emitLog('ERROR', `Unhandled Promise Rejection: ${message}`, {
			'error.type': 'unhandled_rejection',
			'error.stack': stack,
		});
	});
}
