import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export function initTelemetry() {
	// Check if enabled via env var (injected by Vite)
	if (import.meta.env.VITE_OPENTELEMETRY_ENABLED !== 'true') {
		return;
	}

	const provider = new WebTracerProvider({
		resource: new Resource({
			[ATTR_SERVICE_NAME]: import.meta.env.VITE_OPENTELEMETRY_SERVICE_NAME || 'directus-app',
			[ATTR_SERVICE_VERSION]: 'unknown',
		}),
	});

	const exporter = new OTLPTraceExporter({
		url: import.meta.env.VITE_OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	provider.addSpanProcessor(new BatchSpanProcessor(exporter));

	if (import.meta.env.DEV) {
		provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
	}

	provider.register({
		contextManager: new ZoneContextManager(),
	});

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

	// eslint-disable-next-line no-console
	console.log('OpenTelemetry initialized');
}
