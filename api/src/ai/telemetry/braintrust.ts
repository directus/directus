import type { useEnv } from '@directus/env';
import type { AITelemetryState } from './index.js';

export const applyBraintrustEnv = (env: ReturnType<typeof useEnv>) => {
	const apiKey = env['BRAINTRUST_API_KEY'];
	const projectName = env['BRAINTRUST_PROJECT_NAME'];
	const apiUrl = env['BRAINTRUST_API_URL'];

	if (typeof apiKey === 'string' && apiKey.length > 0) {
		process.env['BRAINTRUST_API_KEY'] = apiKey;
	}

	if (typeof projectName === 'string' && projectName.length > 0) {
		process.env['BRAINTRUST_PROJECT_NAME'] = projectName;
	}

	if (typeof apiUrl === 'string' && apiUrl.length > 0) {
		process.env['BRAINTRUST_API_URL'] = apiUrl;
	}
};

export const initBraintrust = async (env: ReturnType<typeof useEnv>): Promise<AITelemetryState> => {
	applyBraintrustEnv(env);

	const [{ BraintrustSpanProcessor }, { NodeTracerProvider }] = await Promise.all([
		import('@braintrust/otel'),
		import('@opentelemetry/sdk-trace-node'),
	]);

	const tracerProvider = new NodeTracerProvider({
		spanProcessors: [new BraintrustSpanProcessor({ filterAISpans: true })],
	} as any);

	return {
		recordIO: env['AI_TELEMETRY_RECORD_IO'] === true,
		tracerProvider: tracerProvider as AITelemetryState['tracerProvider'],
	};
};
