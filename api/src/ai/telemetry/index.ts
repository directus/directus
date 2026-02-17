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

export type AITelemetryState = {
	recordIO: boolean;
	tracerProvider: TracerProviderLike;
};

let telemetryState: AITelemetryState | null = null;
let telemetryInitPromise: Promise<void> | null = null;

export const initAITelemetry = async (): Promise<void> => {
	if (telemetryState) return;
	if (telemetryInitPromise) return telemetryInitPromise;

	const initPromise = (async () => {
		const env = useEnv();

		if (env['AI_TELEMETRY_ENABLED'] !== true) return;

		const logger = useLogger();
		const provider = (env['AI_TELEMETRY_PROVIDER'] as string) || 'langfuse';

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
	})();

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
