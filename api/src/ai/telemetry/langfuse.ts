import type { useEnv } from '@directus/env';
import type { AITelemetryState } from './index.js';

const getStringAttribute = (attributes: Record<string, unknown>, key: string): string | undefined => {
	const value = attributes[key];

	return typeof value === 'string' && value.length > 0 ? value : undefined;
};

/**
 * Langfuse's OTel integration doesn't automatically pick up AI SDK span attributes for input/output display.
 * This processor copies ai.prompt.* / ai.response.* attributes into the langfuse.* namespace as a workaround.
 */
export const createLangfuseInputOutputCompatSpanProcessor = () => {
	return {
		onStart() {
			// noop
		},
		onEnd(span: any) {
			const attributes = span?.attributes as Record<string, unknown> | undefined;

			if (!attributes || typeof attributes !== 'object') return;
			if (typeof span?.name !== 'string' || !span.name.startsWith('ai.')) return;

			const observationInput = getStringAttribute(attributes, 'langfuse.observation.input');
			const traceInput = getStringAttribute(attributes, 'langfuse.trace.input');

			const fallbackInput =
				getStringAttribute(attributes, 'ai.prompt.messages') ?? getStringAttribute(attributes, 'ai.prompt');

			const input = observationInput ?? traceInput ?? fallbackInput;

			const observationOutput = getStringAttribute(attributes, 'langfuse.observation.output');
			const traceOutput = getStringAttribute(attributes, 'langfuse.trace.output');

			const fallbackOutput =
				getStringAttribute(attributes, 'ai.response.text') ?? getStringAttribute(attributes, 'ai.response.object');

			const output = observationOutput ?? traceOutput ?? fallbackOutput;

			if (!observationInput && input) {
				attributes['langfuse.observation.input'] = input;
			}

			if (!traceInput && input) {
				attributes['langfuse.trace.input'] = input;
			}

			if (!observationOutput && output) {
				attributes['langfuse.observation.output'] = output;
			}

			if (!traceOutput && output) {
				attributes['langfuse.trace.output'] = output;
			}
		},
		forceFlush: async () => {
			// noop
		},
		shutdown: async () => {
			// noop
		},
	};
};

export const applyLangfuseEnv = (env: ReturnType<typeof useEnv>) => {
	const secretKey = env['LANGFUSE_SECRET_KEY'];
	const publicKey = env['LANGFUSE_PUBLIC_KEY'];
	const baseUrl = env['LANGFUSE_BASE_URL'];

	if (typeof secretKey === 'string' && secretKey.length > 0) {
		process.env['LANGFUSE_SECRET_KEY'] = secretKey;
	}

	if (typeof publicKey === 'string' && publicKey.length > 0) {
		process.env['LANGFUSE_PUBLIC_KEY'] = publicKey;
	}

	if (typeof baseUrl === 'string' && baseUrl.length > 0) {
		process.env['LANGFUSE_BASE_URL'] = baseUrl;
	}
};

export const initLangfuse = async (env: ReturnType<typeof useEnv>): Promise<AITelemetryState> => {
	applyLangfuseEnv(env);

	const [{ LangfuseSpanProcessor }, { NodeTracerProvider }] = await Promise.all([
		import('@langfuse/otel'),
		import('@opentelemetry/sdk-trace-node'),
	]);

	const tracerProvider = new NodeTracerProvider({
		spanProcessors: [createLangfuseInputOutputCompatSpanProcessor() as any, new LangfuseSpanProcessor()],
	} as any);

	return {
		recordIO: env['AI_TELEMETRY_RECORD_IO'] === true,
		tracerProvider: tracerProvider as AITelemetryState['tracerProvider'],
	};
};
