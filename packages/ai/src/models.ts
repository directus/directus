// Limits and costs adopted from models.dev
// MIT License
// Copyright (c) 2025 models.dev

import type { ModelDefinition, OpenAICompatibleModel, ProviderType } from './types.js';

export const DEFAULT_AI_MODELS: ModelDefinition[] = [
	// OpenAI GPT-4 series
	{
		provider: 'openai',
		model: 'gpt-4o-mini',
		name: 'GPT-4o Mini',
		limit: {
			context: 128_000,
			output: 16_384,
		},
		cost: {
			input: 0.15,
			output: 0.6,
		},
		attachment: true,
		reasoning: false,
	},
	{
		provider: 'openai',
		model: 'gpt-4.1-nano',
		name: 'GPT-4.1 Nano',
		limit: {
			context: 1_047_576,
			output: 32_768,
		},
		cost: {
			input: 0.1,
			output: 0.4,
		},
		attachment: true,
		reasoning: false,
	},
	{
		provider: 'openai',
		model: 'gpt-4.1-mini',
		name: 'GPT-4.1 Mini',
		limit: {
			context: 1_047_576,
			output: 32_768,
		},
		cost: {
			input: 0.4,
			output: 1.6,
		},
		attachment: true,
		reasoning: false,
	},
	{
		provider: 'openai',
		model: 'gpt-4.1',
		name: 'GPT-4.1',
		limit: {
			context: 1_047_576,
			output: 32_768,
		},
		cost: {
			input: 2.0,
			output: 8.0,
		},
		attachment: true,
		reasoning: false,
	},
	// OpenAI GPT-5 series (all support reasoning)
	{
		provider: 'openai',
		model: 'gpt-5-nano',
		name: 'GPT-5 Nano',
		limit: {
			context: 400_000,
			output: 128_000,
		},
		cost: {
			input: 0.05,
			output: 0.4,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5-mini',
		name: 'GPT-5 Mini',
		limit: {
			context: 400_000,
			output: 128_000,
		},
		cost: {
			input: 0.25,
			output: 2,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5',
		name: 'GPT-5',
		limit: {
			context: 400_000,
			output: 128_000,
		},
		cost: {
			input: 1.25,
			output: 10.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.2',
		name: 'GPT-5.2',
		limit: {
			context: 400_000,
			output: 128_000,
		},
		cost: {
			input: 1.75,
			output: 14.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.2-chat-latest',
		name: 'GPT-5.2 Chat',
		limit: {
			context: 128_000,
			output: 16_384,
		},
		cost: {
			input: 1.75,
			output: 14.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.2-pro',
		name: 'GPT-5.2 Pro',
		limit: {
			context: 400_000,
			output: 128_000,
		},
		cost: {
			input: 21.0,
			output: 168.0,
		},
		attachment: true,
		reasoning: true,
	},
	// Anthropic Claude
	{
		provider: 'anthropic',
		model: 'claude-haiku-4-5',
		name: 'Claude Haiku 4.5',
		limit: {
			context: 200_000,
			output: 64_000,
		},
		cost: {
			input: 1.0,
			output: 5.0,
		},
		attachment: true,
		reasoning: false,
	},
	{
		provider: 'anthropic',
		model: 'claude-sonnet-4-5',
		name: 'Claude Sonnet 4.5',
		limit: {
			context: 200_000,
			output: 64_000,
		},
		cost: {
			input: 3.0,
			output: 15.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-opus-4-5',
		name: 'Claude Opus 4.5',
		limit: {
			context: 200_000,
			output: 64_000,
		},
		cost: {
			input: 5.0,
			output: 25.0,
		},
		attachment: true,
		reasoning: true,
	},
	// Google Gemini
	{
		provider: 'google',
		model: 'gemini-3-pro-preview',
		name: 'Gemini 3 Pro Preview',
		limit: {
			context: 1_000_000,
			output: 65_536,
		},
		cost: {
			input: 2.0,
			output: 12.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-3-flash-preview',
		name: 'Gemini 3 Flash Preview',
		limit: {
			context: 1_000_000,
			output: 65_536,
		},
		cost: {
			input: 0.5,
			output: 3.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-2.5-pro',
		name: 'Gemini 2.5 Pro',
		limit: {
			context: 1_000_000,
			output: 65_536,
		},
		cost: {
			input: 1.25,
			output: 5.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-2.5-flash',
		name: 'Gemini 2.5 Flash',
		limit: {
			context: 1_000_000,
			output: 65_536,
		},
		cost: {
			input: 0.15,
			output: 0.6,
		},
		attachment: true,
		reasoning: true,
	},
];

export function buildCustomModels(customModels: OpenAICompatibleModel[] | null): ModelDefinition[] {
	if (!customModels) return [];

	return customModels.map((m) => ({
		provider: 'openai-compatible' as const,
		model: m.id,
		name: m.name,
		limit: {
			context: m.context ?? 128_000,
			output: m.output ?? 16_000,
		},
		cost: {
			input: 0,
			output: 0,
		},
		attachment: m.attachment ?? false,
		reasoning: m.reasoning ?? false,
	}));
}

export function buildCustomModelDefinition(provider: ProviderType, modelId: string): ModelDefinition {
	return {
		provider,
		model: modelId,
		name: modelId,
		limit: {
			context: 128_000,
			output: 16_000,
		},
		cost: {
			input: 0,
			output: 0,
		},
		attachment: false,
		reasoning: false,
	};
}
