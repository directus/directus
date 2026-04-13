import type { ProviderType } from '@directus/ai';
import { useEnv } from '@directus/env';
import type { TelemetrySettings } from 'ai';
import { useLogger } from '../../logger/index.js';

type TracerProviderLike = {
	getTracer: (name: string) => NonNullable<TelemetrySettings['tracer']>;
	shutdown: () => Promise<void>;
};

type AITelemetryMetadata = {
	userId?: string | null | undefined;
	role?: string | null | undefined;
	provider: ProviderType;
	model: string;
};

export type AITelemetryState = {
	recordIO: boolean;
	tracerProvider: TracerProviderLike;
};

let telemetryState: AITelemetryState | null = null;
let telemetryInitPromise: Promise<void> | null = null;

async function doTelemetryInit(): Promise<void> {
	const env = useEnv();

	if (env['AI_TELEMETRY_ENABLED'] !== true) return;

	const logger = useLogger();
	const provider = (env['AI_TELEMETRY_PROVIDER'] as string) || 'langfuse';

	const requiredKeys: Record<string, string[]> = {
		langfuse: ['LANGFUSE_SECRET_KEY', 'LANGFUSE_PUBLIC_KEY'],
		braintrust: ['BRAINTRUST_API_KEY'],
	};

	const missing = (requiredKeys[provider] ?? []).filter(
		(key) => !(typeof env[key] === 'string' && (env[key] as string).length > 0),
	);

	if (missing.length > 0) {
		logger.warn(`AI telemetry provider "${provider}" is missing required config: ${missing.join(', ')}`);
	}

	try {
		let state: AITelemetryState;

		switch (provider) {
			case 'langfuse': {
				const { initLangfuse } = await import('./langfuse.js');
				state = await initLangfuse(env);
				break;
			}

			case 'braintrust': {
				const { initBraintrust } = await import('./braintrust.js');
				state = await initBraintrust(env);
				break;
			}

			default:
				logger.warn(`Unknown AI telemetry provider "${provider}". Supported: langfuse, braintrust`);
				return;
		}

		telemetryState = state;
		logger.info(`AI telemetry enabled via ${provider}`);
	} catch (error) {
		logger.warn(error, 'Failed to initialize AI telemetry');
	}
}

export const initAITelemetry = async (): Promise<void> => {
	if (telemetryState) return;
	if (telemetryInitPromise) return telemetryInitPromise;

	const initPromise = doTelemetryInit().finally(() => {
		telemetryInitPromise = null;
	});

	telemetryInitPromise = initPromise;

	return initPromise;
};

export const getAITelemetryConfig = (
	metadata: AITelemetryMetadata,
	functionId = 'directus-ai-chat',
): TelemetrySettings | undefined => {
	if (!telemetryState) return undefined;

	const telemetryMetadata: NonNullable<TelemetrySettings['metadata']> = {
		provider: metadata.provider,
		model: metadata.model,
		...(metadata.userId != null ? { userId: metadata.userId } : {}),
		...(metadata.role != null ? { role: metadata.role } : {}),
	};

	return {
		isEnabled: true,
		tracer: telemetryState.tracerProvider.getTracer('directus-ai'),
		functionId,
		recordInputs: telemetryState.recordIO,
		recordOutputs: telemetryState.recordIO,
		metadata: telemetryMetadata,
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
