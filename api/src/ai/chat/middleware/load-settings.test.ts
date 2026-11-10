import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAISettings } from '../../providers/settings.js';
import type { AISettings } from '../../providers/types.js';
import { loadSettings } from './load-settings.js';

vi.mock('../../providers/settings.js', () => ({
	getAISettings: vi.fn(),
}));

const settings: AISettings = {
	openaiApiKey: 'test-key',
	anthropicApiKey: null,
	googleApiKey: null,
	openrouterApiKey: null,
	openaiCompatibleApiKey: null,
	openaiCompatibleBaseUrl: null,
	openaiCompatibleName: null,
	openaiCompatibleModels: null,
	openaiCompatibleHeaders: null,
	allowedModels: { openai: ['gpt-5'], anthropic: [], google: [], openrouter: [] },
	systemPrompt: 'You are Directus.',
};

beforeEach(() => {
	vi.clearAllMocks();
});

test.each([
	['a system prompt', 'You are Directus.'],
	['no system prompt', null],
])('stores AI settings and %s in res.locals', async (_, systemPrompt) => {
	vi.mocked(getAISettings).mockResolvedValue({ ...settings, systemPrompt });

	const res = { locals: {} } as Response;
	const next = vi.fn();

	await loadSettings({} as Request, res, next);

	expect(res.locals).toEqual({ ai: { settings: { ...settings, systemPrompt }, systemPrompt } });
	expect(next).toHaveBeenCalledTimes(1);
});

test('does not continue when the settings cannot be read', async () => {
	vi.mocked(getAISettings).mockRejectedValue(new Error('Database error'));

	const next = vi.fn();

	await expect(loadSettings({} as Request, { locals: {} } as Response, next)).rejects.toThrow('Database error');
	expect(next).not.toHaveBeenCalled();
});
