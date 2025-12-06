import { useEnv } from '@directus/env';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { useLogger } from '../logger/index.js';

export async function initTelemetry() {
	const env = useEnv();
	const logger = useLogger();

	if (env['OPENTELEMETRY_ENABLED'] !== true) {
		return;
	}

	const sdk = new NodeSDK({
		resource: new Resource({
			[ATTR_SERVICE_NAME]: (env['OPENTELEMETRY_SERVICE_NAME'] as string) || 'directus-api',
			[ATTR_SERVICE_VERSION]: process.env['npm_package_version'] || 'unknown',
		}),
		traceExporter: new OTLPTraceExporter({
			url: (env['OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT'] as string) || 'http://localhost:4318/v1/traces',
		}),
		instrumentations: [getNodeAutoInstrumentations()],
	});

	try {
		sdk.start();
		logger.info('OpenTelemetry initialized');
	} catch (error) {
		logger.error(error, 'Error initializing OpenTelemetry');
	}
}
