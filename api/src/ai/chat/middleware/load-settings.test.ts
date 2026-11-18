import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAISettings } from '../../providers/settings.js';
import type { AISettings } from '../../providers/types.js';
import { loadSettings } from './load-settings.js';

vi.mock('../../providers/settings.js', () => ({
	getAISettings: vi.fn(),
}));

const settings = { ai_openai_api_key: 'test-key', ai_system_prompt: 'You are Directus.' } as AISettings;

beforeEach(() => {
	vi.clearAllMocks();
});

test('stores the AI settings in res.locals, reading them with the request schema', async () => {
	vi.mocked(getAISettings).mockResolvedValue(settings);

	const schema = { collections: {}, relations: [] };
	const res = { locals: {} } as Response;
	const next = vi.fn();

	await loadSettings({ schema } as unknown as Request, res, next);

	expect(getAISettings).toHaveBeenCalledWith({ schema });
	expect(res.locals).toEqual({ ai: { settings } });
	expect(next).toHaveBeenCalledTimes(1);
});

test('does not continue when the settings cannot be read', async () => {
	vi.mocked(getAISettings).mockRejectedValue(new Error('Database error'));

	const next = vi.fn();

	await expect(loadSettings({} as Request, { locals: {} } as Response, next)).rejects.toThrow('Database error');
	expect(next).not.toHaveBeenCalled();
});
