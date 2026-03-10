import type { ProviderType } from '@directus/ai';
import { ServiceUnavailableError } from '@directus/errors';
import {
	convertToModelMessages,
	type LanguageModelUsage,
	stepCountIs,
	streamText,
	type StreamTextResult,
	type Tool,
	type UIMessage,
} from 'ai';
import {
	type AISettings,
	buildProviderConfigs,
	createAIProviderRegistry,
	getProviderOptions,
} from '../../providers/index.js';
import { SYSTEM_PROMPT } from '../constants/system-prompt.js';
import type { ChatContext } from '../models/chat-request.js';
import { formatContextForSystemPrompt } from '../utils/format-context.js';
import { transformFilePartsForProvider } from './transform-file-parts.js';

export interface CreateUiStreamOptions {
	provider: ProviderType;
	model: string;
	tools: { [x: string]: Tool };
	aiSettings: AISettings;
	systemPrompt?: string;
	context?: ChatContext;
	onUsage?: (usage: Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens' | 'totalTokens'>) => void | Promise<void>;
}

export const createUiStream = async (
	messages: UIMessage[],
	{ provider, model, tools, aiSettings, systemPrompt, context, onUsage }: CreateUiStreamOptions,
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
	// Compute the full system prompt once to avoid re-computing on each step
	const fullSystemPrompt = contextBlock ? baseSystemPrompt + contextBlock : baseSystemPrompt;

	const stream = streamText({
		system: baseSystemPrompt,
		model: registry.languageModel(`${provider}:${model}`),
		messages: await convertToModelMessages(transformFilePartsForProvider(messages)),
		stopWhen: [stepCountIs(10)],
		providerOptions,
		tools,
		/**
		 * prepareStep is called before each AI step to prepare the system prompt.
		 * When context exists, we override the system prompt to include context attachments.
		 * This allows the initial system prompt to be simple while ensuring all steps
		 * (including tool continuation steps) receive the full context.
		 */
		prepareStep: () => {
			if (contextBlock) {
				return { system: fullSystemPrompt };
			}

			return {};
		},
		onFinish({ usage }) {
			if (onUsage) {
				const { inputTokens, outputTokens, totalTokens } = usage;
				onUsage({ inputTokens, outputTokens, totalTokens });
			}
		},
	});

	return stream as StreamTextResult<Record<string, Tool<any, any>>, any>;
};
