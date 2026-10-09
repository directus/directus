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
		model: 'gpt-5.1',
		name: 'GPT-5.1',
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
	{
		provider: 'openai',
		model: 'gpt-5.4-nano',
		name: 'GPT-5.4 Nano',
		limit: {
			context: 400_000,
			output: 128_000,
		},
		cost: {
			input: 0.2,
			output: 1.25,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.4-mini',
		name: 'GPT-5.4 Mini',
		limit: {
			context: 400_000,
			output: 128_000,
		},
		cost: {
			input: 0.75,
			output: 4.5,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.4',
		name: 'GPT-5.4',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 2.5,
			output: 15.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.4-pro',
		name: 'GPT-5.4 Pro',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 30.0,
			output: 180.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.5',
		name: 'GPT-5.5',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 5.0,
			output: 30.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.5-pro',
		name: 'GPT-5.5 Pro',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 30.0,
			output: 180.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.6-luna',
		name: 'GPT-5.6 Luna',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 0.2,
			output: 1.2,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.6-terra',
		name: 'GPT-5.6 Terra',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 2.0,
			output: 12.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.6-sol',
		name: 'GPT-5.6 Sol',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 4.0,
			output: 20.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-5.6',
		name: 'GPT-5.6',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 4.0,
			output: 20.0,
		},
		attachment: true,
		reasoning: true,
	},
	// OpenAI GPT-6 series
	{
		provider: 'openai',
		model: 'gpt-6-luna',
		name: 'GPT-6 Luna',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 0.1,
			output: 0.5,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-6-sol',
		name: 'GPT-6 Sol',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 2.0,
			output: 10.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-6-astra',
		name: 'GPT-6 Astra',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 10.0,
			output: 50.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'openai',
		model: 'gpt-6.1-sol',
		name: 'GPT-6.1 Sol',
		limit: {
			context: 1_050_000,
			output: 128_000,
		},
		cost: {
			input: 2.0,
			output: 10.0,
		},
		attachment: true,
		reasoning: true,
	},
	// Anthropic Claude
	{
		provider: 'anthropic',
		model: 'claude-haiku-5-5',
		name: 'Claude Haiku 5.5',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 0.1,
			output: 0.5,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-sonnet-5-5',
		name: 'Claude Sonnet 5.5',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 2.0,
			output: 10.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-opus-5-5',
		name: 'Claude Opus 5.5',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 4.0,
			output: 20.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-fable-5-1',
		name: 'Claude Fable 5.1',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 10.0,
			output: 50.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-sonnet-5',
		name: 'Claude Sonnet 5',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 2.0,
			output: 10.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-opus-5',
		name: 'Claude Opus 5',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 5.0,
			output: 25.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-fable-5',
		name: 'Claude Fable 5',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 10.0,
			output: 50.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-opus-4-8',
		name: 'Claude Opus 4.8',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 5.0,
			output: 25.0,
		},
		attachment: true,
		reasoning: true,
	},
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
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-sonnet-4-6',
		name: 'Claude Sonnet 4.6',
		limit: {
			context: 1_000_000,
			output: 128_000,
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
		model: 'claude-opus-4-7',
		name: 'Claude Opus 4.7',
		limit: {
			context: 1_000_000,
			output: 128_000,
		},
		cost: {
			input: 5.0,
			output: 25.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'anthropic',
		model: 'claude-opus-4-6',
		name: 'Claude Opus 4.6',
		limit: {
			context: 1_000_000,
			output: 128_000,
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
		model: 'gemini-3.8-flash',
		name: 'Gemini 3.8 Flash',
		limit: {
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 0.75,
			output: 3.75,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-3.7-flash',
		name: 'Gemini 3.7 Flash',
		limit: {
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 0.75,
			output: 3.75,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-3.6-flash',
		name: 'Gemini 3.6 Flash',
		limit: {
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 0.75,
			output: 3.75,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-3.5-flash',
		name: 'Gemini 3.5 Flash',
		limit: {
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 1.5,
			output: 9.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-3.5-flash-lite',
		name: 'Gemini 3.5 Flash Lite',
		limit: {
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 0.3,
			output: 2.5,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-3.1-flash-lite',
		name: 'Gemini 3.1 Flash Lite',
		limit: {
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 0.25,
			output: 1.5,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-3.1-pro-preview',
		name: 'Gemini 3.1 Pro Preview',
		limit: {
			context: 1_048_576,
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
			context: 1_048_576,
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
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 1.25,
			output: 10.0,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-2.5-flash',
		name: 'Gemini 2.5 Flash',
		limit: {
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 0.3,
			output: 2.5,
		},
		attachment: true,
		reasoning: true,
	},
	{
		provider: 'google',
		model: 'gemini-2.5-flash-lite',
		name: 'Gemini 2.5 Flash Lite',
		limit: {
			context: 1_048_576,
			output: 65_536,
		},
		cost: {
			input: 0.1,
			output: 0.4,
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
