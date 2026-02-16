import type { ProviderType } from '@directus/ai';
import { useEnv } from '@directus/env';
import { useLogger } from '../../logger/index.js';

type TracerProviderLike = {
	getTracer: (name: string) => unknown;
	shutdown: () => Promise<void>;
};

type AITelemetryMetadata = {
	userId?: string | null;
	role?: string | null;
	provider: ProviderType;
	model: string;
};

type AITelemetryState = {
	recordIO: boolean;
	tracerProvider: TracerProviderLike;
};

let telemetryState: AITelemetryState | null = null;
let telemetryInitPromise: Promise<void> | null = null;

const getStringAttribute = (attributes: Record<string, unknown>, key: string): string | undefined => {
	const value = attributes[key];

	return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const createLangfuseInputOutputCompatSpanProcessor = () => {
	return {
		onStart() {
			// noop
		},
		onEnd(span: any) {
			const attributes = span?.attributes as Record<string, unknown> | undefined;

			if (!attributes || typeof attributes !== 'object') return;
			if (typeof span?.name !== 'string' || !span.name.startsWith('ai.')) return;

			const input =
				getStringAttribute(attributes, 'langfuse.observation.input') ??
				getStringAttribute(attributes, 'langfuse.trace.input') ??
				getStringAttribute(attributes, 'ai.prompt.messages') ??
				getStringAttribute(attributes, 'ai.prompt');

			const output =
				getStringAttribute(attributes, 'langfuse.observation.output') ??
				getStringAttribute(attributes, 'langfuse.trace.output') ??
				getStringAttribute(attributes, 'ai.response.text') ??
				getStringAttribute(attributes, 'ai.response.object');

			if (!getStringAttribute(attributes, 'langfuse.observation.input') && input) {
				attributes['langfuse.observation.input'] = input;
			}

			if (!getStringAttribute(attributes, 'langfuse.trace.input') && input) {
				attributes['langfuse.trace.input'] = input;
			}

			if (!getStringAttribute(attributes, 'langfuse.observation.output') && output) {
				attributes['langfuse.observation.output'] = output;
			}

			if (!getStringAttribute(attributes, 'langfuse.trace.output') && output) {
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

const applyLangfuseEnv = (env: ReturnType<typeof useEnv>) => {
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

export const initAITelemetry = async (): Promise<void> => {
	if (telemetryState) return;
	if (telemetryInitPromise) return telemetryInitPromise;

	const initPromise = (async () => {
		const env = useEnv();

		if (env['AI_TELEMETRY_ENABLED'] !== true) return;

		const logger = useLogger();

		try {
			applyLangfuseEnv(env);

			const [{ LangfuseSpanProcessor }, { NodeTracerProvider }] = await Promise.all([
				import('@langfuse/otel'),
				import('@opentelemetry/sdk-trace-node'),
			]);

			const tracerProvider = new NodeTracerProvider({
				spanProcessors: [createLangfuseInputOutputCompatSpanProcessor() as any, new LangfuseSpanProcessor()],
			} as any);

			telemetryState = {
				recordIO: env['AI_TELEMETRY_RECORD_IO'] === true,
				tracerProvider: tracerProvider as TracerProviderLike,
			};

			const baseUrl = env['LANGFUSE_BASE_URL'];
			logger.info(`AI telemetry enabled, sending traces to ${baseUrl}`);
		} catch (error) {
			logger.warn(error, 'Failed to initialize AI telemetry');
		}
	})().finally(() => {
		telemetryInitPromise = null;
	});

	telemetryInitPromise = initPromise;

	return initPromise;
};

export const getAITelemetryConfig = (metadata: AITelemetryMetadata): Record<string, unknown> | undefined => {
	if (!telemetryState) return undefined;

	return {
		isEnabled: true,
		tracer: telemetryState.tracerProvider.getTracer('directus-ai'),
		functionId: 'directus-ai-chat',
		recordInputs: telemetryState.recordIO,
		recordOutputs: telemetryState.recordIO,
		metadata,
	};
};

export const shutdownAITelemetry = async (): Promise<void> => {
	if (telemetryInitPromise) {
		await telemetryInitPromise;
	}

	if (!telemetryState) return;

	const logger = useLogger();
	const { tracerProvider } = telemetryState;
	telemetryState = null;

	try {
		await tracerProvider.shutdown();
	} catch (error) {
		logger.warn(error, 'Failed to shut down AI telemetry');
	}
};
