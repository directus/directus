import { useEnv } from '@directus/env';
import { logs } from '@opentelemetry/api-logs';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { useLogger } from '../logger/index.js';

let sdk: NodeSDK | null = null;
let loggerProvider: LoggerProvider | null = null;
let meterProvider: MeterProvider | null = null;

export async function initTelemetry() {
	const env = useEnv();
	const logger = useLogger();

	if (env['OPENTELEMETRY_ENABLED'] !== true) {
		return;
	}

	const baseEndpoint = (env['OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT'] as string) || 'http://localhost:4318';
	const serviceName = (env['OPENTELEMETRY_SERVICE_NAME'] as string) || 'directus-api';
	const serviceVersion = process.env['npm_package_version'] || 'unknown';

	const resource = new Resource({
		[ATTR_SERVICE_NAME]: serviceName,
		[ATTR_SERVICE_VERSION]: serviceVersion,
	});

	// ========== LOGS ==========
	const logExporter = new OTLPLogExporter({
		url: `${baseEndpoint}/v1/logs`,
	});

	loggerProvider = new LoggerProvider({ resource });
	loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
	logs.setGlobalLoggerProvider(loggerProvider);

	// ========== METRICS ==========
	const metricExporter = new OTLPMetricExporter({
		url: `${baseEndpoint}/v1/metrics`,
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

	// ========== TRACES (via NodeSDK) ==========
	sdk = new NodeSDK({
		resource,
		traceExporter: new OTLPTraceExporter({
			url: `${baseEndpoint}/v1/traces`,
		}),
		logRecordProcessor: new BatchLogRecordProcessor(logExporter),
		metricReader: new PeriodicExportingMetricReader({
			exporter: metricExporter,
			exportIntervalMillis: 60000,
		}),
		instrumentations: [getNodeAutoInstrumentations()],
	});

	try {
		sdk.start();
		logger.info('OpenTelemetry initialized with traces, logs, and metrics');
	} catch (error) {
		logger.error(error, 'Error initializing OpenTelemetry');
	}
}

/**
 * Get the OpenTelemetry logger for emitting structured logs
 */
export function getOtelLogger(name = 'directus-api') {
	return logs.getLogger(name);
}

/**
 * Get the OpenTelemetry meter for recording metrics
 */
export function getOtelMeter(name = 'directus-api') {
	return meterProvider?.getMeter(name);
}

/**
 * Gracefully shutdown OpenTelemetry providers
 */
export async function shutdownTelemetry() {
	const logger = useLogger();

	try {
		await Promise.all([sdk?.shutdown(), loggerProvider?.shutdown(), meterProvider?.shutdown()]);

		logger.info('OpenTelemetry shutdown complete');
	} catch (error) {
		logger.error(error, 'Error shutting down OpenTelemetry');
	}
}
