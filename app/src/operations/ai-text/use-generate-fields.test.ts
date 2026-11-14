import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useGenerateFields } from './use-generate-fields';
import api from '@/api';

vi.mock('@/api', () => ({ default: { post: vi.fn() } }));
vi.mock('@/lang', () => ({ i18n: { global: { t: (key: string) => key } } }));
vi.mock('@/stores/server', () => ({ useServerStore: () => ({ info: { ai_providers: ['openai'] } }) }));
vi.mock('@/stores/settings', () => ({ useSettingsStore: () => ({ settings: {} }) }));

vi.mock('@/ai/utils/available-models', () => ({
	getAvailableModels: () => [
		{ provider: 'openai', model: 'gpt-a', name: 'A' },
		{ provider: 'openai', model: 'gpt-b', name: 'B' },
	],
	getModelKey: (model: { provider: string; model: string }) => `${model.provider}:${model.model}`,
}));

afterEach(() => {
	vi.mocked(api.post).mockReset();
});

function httpError(status: number, data: string) {
	return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
		status,
		statusText: '',
		data,
		headers: {},
		config: { headers: new AxiosHeaders() },
	});
}

describe('useGenerateFields', () => {
	test("uses the step's model when it's allowed, otherwise the first allowed one", () => {
		expect(useGenerateFields(() => 'openai:gpt-b').model.value?.model).toBe('gpt-b');
		expect(useGenerateFields(() => 'anthropic:other').model.value?.model).toBe('gpt-a');
	});

	test('sends the request through the shared api client and drops empty lists', async () => {
		vi.mocked(api.post).mockResolvedValue({
			data: JSON.stringify({ fields: [{ name: 'alt', type: 'string', choices: [], fields: [] }] }),
		});

		const fields = await useGenerateFields(() => 'openai:gpt-a').generate('Alt text');

		expect(api.post).toHaveBeenCalledWith('/ai/object', expect.objectContaining({ model: 'gpt-a' }), {
			signal: undefined,
			responseType: 'text',
		});

		expect(fields).toEqual([{ name: 'alt', type: 'string' }]);
	});

	test.each([
		['a cut-off reply', '{"fields": [{"name"'],
		['a reply without fields', '{}'],
	])('explains %s', async (_, data) => {
		vi.mocked(api.post).mockResolvedValue({ data });

		await expect(useGenerateFields(() => undefined).generate('x')).rejects.toThrow(
			'operations.ai-text.generate_incomplete',
		);
	});

	test("shows the API's error message", async () => {
		vi.mocked(api.post).mockRejectedValue(httpError(400, '{"errors":[{"message":"Model not allowed"}]}'));

		await expect(useGenerateFields(() => undefined).generate('x')).rejects.toThrow('Model not allowed');
	});

	test('shows a generic message for a page that is not a Directus error', async () => {
		vi.mocked(api.post).mockRejectedValue(httpError(502, '<html>Bad Gateway</html>'));

		await expect(useGenerateFields(() => undefined).generate('x')).rejects.toThrow(
			'operations.ai-text.generate_failed',
		);
	});

	test('passes a cancelled request through unchanged', async () => {
		const controller = new AbortController();
		const error = httpError(499, '');
		controller.abort();
		vi.mocked(api.post).mockRejectedValue(error);

		await expect(useGenerateFields(() => undefined).generate('x', controller.signal)).rejects.toBe(error);
	});
});
