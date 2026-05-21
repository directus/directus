import type { ProviderType } from '@directus/ai';
import { ServiceUnavailableError } from '@directus/errors';
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type StreamTextResult,
	type Tool,
	type UIMessage,
	wrapLanguageModel,
} from 'ai';
import { getDevToolsMiddleware } from '../../devtools/index.js';
import { applyAnthropicToolSearch } from '../../providers/anthropic-tool-search.js';
import {
	type AISettings,
	buildProviderConfigs,
	createAIProviderRegistry,
	getProviderOptions,
} from '../../providers/index.js';
import { getAITelemetryConfig } from '../../telemetry/index.js';
import { SYSTEM_PROMPT } from '../constants/system-prompt.js';
import type { ChatContext } from '../models/chat-request.js';
import { formatContextForSystemPrompt } from '../utils/format-context.js';
import {
	applyAnthropicConversationCaching,
	buildCacheAwareSystemPrompt,
	formatUsageWithCacheTokens,
	type PromptCachingUsage,
	sortToolsByName,
} from '../utils/prompt-caching.js';
import { transformFilePartsForProvider } from './transform-file-parts.js';

export interface CreateUiStreamOptions {
	provider: ProviderType;
	model: string;
	tools: { [x: string]: Tool };
	aiSettings: AISettings;
	systemPrompt?: string;
	userId?: string | null;
	role?: string | null;
	context?: ChatContext;
	onUsage?: (usage: PromptCachingUsage) => void | Promise<void>;
}

export const createUiStream = async (
	messages: UIMessage[],
	{ provider, model, tools, aiSettings, systemPrompt, userId, role, context, onUsage }: CreateUiStreamOptions,
): Promise<StreamTextResult<Record<string, Tool<any, any>>, any>> => {
	const configs = buildProviderConfigs(aiSettings);
	const providerConfig = configs.find((c) => c.type === provider);

	if (!providerConfig) {
		throw new ServiceUnavailableError({ service: provider, reason: 'No API key configured for LLM provider' });
	}

	const registry = createAIProviderRegistry(configs, aiSettings);

	const baseSystemPrompt = systemPrompt || SYSTEM_PROMPT;
	const contextBlock = context ? formatContextForSystemPrompt(context) : null;
	const providerOptions = getProviderOptions(provider, model, aiSettings);
	let languageModel = registry.languageModel(`${provider}:${model}`);
	const devToolsMiddleware = getDevToolsMiddleware();

	if (devToolsMiddleware) {
		languageModel = wrapLanguageModel({
			model: languageModel,
			middleware: devToolsMiddleware,
		});
	}

	// For Anthropic, keep `system` as the stable base prompt only (so the tools+system prefix
	// caches across page changes) and inject context after a cache breakpoint on the last
	// existing message. For other providers, keep context inside `system` as before.
	const systemPromptText =
		provider === 'anthropic' || !contextBlock ? baseSystemPrompt : baseSystemPrompt + contextBlock;

	const streamSystemPrompt = buildCacheAwareSystemPrompt(provider, systemPromptText);

	const finalTools = sortToolsByName(applyAnthropicToolSearch(provider, model, tools));
	const telemetryConfig = getAITelemetryConfig({ provider, model, userId, role });

	const modelMessages = await convertToModelMessages(transformFilePartsForProvider(messages));
	const streamMessages = applyAnthropicConversationCaching(provider, modelMessages, contextBlock);

	const stream = streamText({
		system: streamSystemPrompt,
		model: languageModel,
		messages: streamMessages,
		stopWhen: [stepCountIs(10)],
		providerOptions,
		tools: finalTools,
		...(telemetryConfig ? { experimental_telemetry: telemetryConfig } : {}),
		onFinish(result) {
			if (onUsage) {
				onUsage(formatUsageWithCacheTokens(result));
			}
		},
	});

	return stream as StreamTextResult<Record<string, Tool<any, any>>, any>;
};
