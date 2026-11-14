import type { ProviderType } from '@directus/ai';
import { convertToModelMessages, stepCountIs, streamText, type StreamTextResult, type Tool, type UIMessage } from 'ai';
import { useLogger } from '../../../logger/index.js';
import { resolveLanguageModel } from '../../providers/resolve-model.js';
import type { AISettings } from '../../providers/types.js';
import { getAITelemetryConfig } from '../../telemetry/index.js';
import { SYSTEM_PROMPT } from '../constants/system-prompt.js';
import type { ChatContext } from '../models/chat-request.js';
import { formatContextForSystemPrompt } from '../utils/format-context.js';
import {
	applyAnthropicConversationCaching,
	buildCacheAwareSystemPrompt,
	formatUsageWithCacheTokens,
	getOpenRouterAutomaticCacheOptions,
	type PromptCachingUsage,
	sortToolsByName,
	usesAnthropicCaching,
} from '../utils/prompt-caching.js';
import { ipValidatedDownload } from './ip-validated-download.js';
import { transformFilePartsForProvider } from './transform-file-parts.js';

export interface CreateUiStreamOptions {
	provider: ProviderType;
	model: string;
	tools: { [x: string]: Tool };
	aiSettings: AISettings;
	userId?: string | null;
	role?: string | null;
	context?: ChatContext;
	onUsage?: (usage: PromptCachingUsage) => void | Promise<void>;
}

export const createUiStream = async (
	messages: UIMessage[],
	{ provider, model, tools, aiSettings, userId, role, context, onUsage }: CreateUiStreamOptions,
): Promise<StreamTextResult<Record<string, Tool<any, any>>, any>> => {
	const { model: languageModel, providerOptions } = resolveLanguageModel(provider, model, aiSettings);

	const baseSystemPrompt = aiSettings.ai_system_prompt || SYSTEM_PROMPT;
	const contextBlock = context ? formatContextForSystemPrompt(context) : null;

	// For Anthropic models, keep `system` as the stable base prompt only (so the tools+system prefix
	// caches across page changes) and inject context after a cache breakpoint on the last
	// existing message. For other providers, keep context inside `system` as before.
	const systemPromptText =
		usesAnthropicCaching(provider, model) || !contextBlock ? baseSystemPrompt : baseSystemPrompt + contextBlock;

	const streamSystemPrompt = buildCacheAwareSystemPrompt(provider, model, systemPromptText);

	const finalTools = sortToolsByName(tools);
	const telemetryConfig = getAITelemetryConfig({ provider, model, userId, role });
	const logger = useLogger();

	const modelMessages = await convertToModelMessages(transformFilePartsForProvider(messages));
	const streamMessages = applyAnthropicConversationCaching(provider, model, modelMessages, contextBlock);

	const stream = streamText({
		system: streamSystemPrompt,
		model: languageModel,
		messages: streamMessages,
		stopWhen: [stepCountIs(10)],
		experimental_download: ipValidatedDownload,
		providerOptions,
		...(provider === 'openrouter'
			? {
					prepareStep: ({ messages }) => ({
						providerOptions: { ...providerOptions, ...getOpenRouterAutomaticCacheOptions(provider, model, messages) },
					}),
				}
			: {}),
		tools: finalTools,
		...(telemetryConfig ? { experimental_telemetry: telemetryConfig } : {}),
		onError(error) {
			logger.error({ error }, 'AI chat stream failed');
		},
		onFinish(result) {
			if (onUsage) {
				onUsage(formatUsageWithCacheTokens(result));
			}
		},
	});

	return stream as StreamTextResult<Record<string, Tool<any, any>>, any>;
};
