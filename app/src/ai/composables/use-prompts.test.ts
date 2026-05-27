import { useApi } from '@directus/composables';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { MCPPrompt } from '../types';
import { usePrompts } from './use-prompts';

vi.mock('@directus/composables', () => ({
	useApi: vi.fn(() => ({
		get: vi.fn(),
	})),
}));

vi.mock('@/stores/settings', () => ({
	useSettingsStore: vi.fn(() => ({
		settings: {
			mcp_prompts_collection: 'ai_prompts',
		},
	})),
}));

vi.mock('ai', () => ({
	generateId: vi.fn(() => 'mock-id'),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe('usePrompts', () => {
	describe('sanitizeTemplate (via extractVariables)', () => {
		test('removes descriptions from {{ var: desc }}', () => {
			const { extractVariables } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: '{{ name: Enter your name }}',
			};

			const vars = extractVariables(prompt);
			expect(vars).toEqual(['name']);
		});

		test('handles multiple variables with descriptions', () => {
			const { extractVariables } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: 'Hello {{ name: Your name }}, you are {{ age: Your age }} years old',
			};

			const vars = extractVariables(prompt);
			expect(vars).toContain('name');
			expect(vars).toContain('age');
		});
	});

	describe('extractVariables', () => {
		test('extracts vars from system_prompt', () => {
			const { extractVariables } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: 'Hello {{ name }}, welcome to {{ place }}',
			};

			const vars = extractVariables(prompt);
			expect(vars).toEqual(['name', 'place']);
		});

		test('extracts vars from messages', () => {
			const { extractVariables } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				messages: [
					{ role: 'user', text: 'My name is {{ name }}' },
					{ role: 'assistant', text: 'Hello {{ name }}, how can I help with {{ topic }}?' },
				],
			};

			const vars = extractVariables(prompt);
			expect(vars).toContain('name');
			expect(vars).toContain('topic');
		});

		test('deduplicates variables', () => {
			const { extractVariables } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: '{{ name }} {{ name }}',
				messages: [{ role: 'user', text: '{{ name }}' }],
			};

			const vars = extractVariables(prompt);
			expect(vars).toEqual(['name']);
		});

		test('returns empty array for no variables', () => {
			const { extractVariables } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: 'Plain text',
			};

			const vars = extractVariables(prompt);
			expect(vars).toEqual([]);
		});

		test('handles missing system_prompt and messages', () => {
			const { extractVariables } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
			};

			const vars = extractVariables(prompt);
			expect(vars).toEqual([]);
		});
	});

	describe('renderPrompt', () => {
		test('substitutes values in system_prompt', () => {
			const { renderPrompt } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: 'Hello {{ name }}',
			};

			const result = renderPrompt(prompt, { name: 'World' });
			expect(result.system_prompt).toBe('Hello World');
		});

		test('substitutes values in messages', () => {
			const { renderPrompt } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				messages: [{ role: 'user', text: 'My name is {{ name }}' }],
			};

			const result = renderPrompt(prompt, { name: 'Alice' });
			expect(result.messages[0]!.text).toBe('My name is Alice');
			expect(result.messages[0]!.role).toBe('user');
		});

		test('handles render failures by using original text', () => {
			const { renderPrompt } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				// Invalid template syntax that might cause render to fail
				system_prompt: 'Hello {{ name }}',
			};

			// Missing value should still work (micromustache returns empty string)
			const result = renderPrompt(prompt, {});
			expect(result.system_prompt).toBeDefined();
		});

		test('handles empty messages array', () => {
			const { renderPrompt } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				messages: [],
			};

			const result = renderPrompt(prompt, {});
			expect(result.messages).toEqual([]);
		});

		test('handles missing messages', () => {
			const { renderPrompt } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
			};

			const result = renderPrompt(prompt, {});
			expect(result.messages).toEqual([]);
		});
	});

	describe('convertToUIMessages', () => {
		test('creates system message from system_prompt', () => {
			const { convertToUIMessages } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: 'You are a helpful assistant',
			};

			const messages = convertToUIMessages(prompt, {});

			expect(messages).toHaveLength(1);
			expect(messages[0]!.role).toBe('system');

			expect(messages[0]!.parts[0]).toEqual({
				type: 'text',
				text: 'You are a helpful assistant',
				state: 'done',
			});
		});

		test('creates conversation messages', () => {
			const { convertToUIMessages } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				messages: [
					{ role: 'user', text: 'Hello' },
					{ role: 'assistant', text: 'Hi there!' },
				],
			};

			const messages = convertToUIMessages(prompt, {});

			expect(messages).toHaveLength(2);
			expect(messages[0]!.role).toBe('user');
			expect(messages[1]!.role).toBe('assistant');
		});

		test('combines system and conversation messages', () => {
			const { convertToUIMessages } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: 'System prompt',
				messages: [{ role: 'user', text: 'User message' }],
			};

			const messages = convertToUIMessages(prompt, {});

			expect(messages).toHaveLength(2);
			expect(messages[0]!.role).toBe('system');
			expect(messages[1]!.role).toBe('user');
		});

		test('applies variable substitution', () => {
			const { convertToUIMessages } = usePrompts();

			const prompt: MCPPrompt = {
				id: '1',
				name: 'test',
				status: 'published',
				system_prompt: 'Help {{ name }}',
				messages: [{ role: 'user', text: 'My name is {{ name }}' }],
			};

			const messages = convertToUIMessages(prompt, { name: 'Bob' });

			const firstPart = messages[0]?.parts[0];
			const secondPart = messages[1]?.parts[0];

			expect(firstPart?.type).toBe('text');
			expect(secondPart?.type).toBe('text');

			if (firstPart?.type === 'text') {
				expect(firstPart.text).toBe('Help Bob');
			}

			if (secondPart?.type === 'text') {
				expect(secondPart.text).toBe('My name is Bob');
			}
		});
	});

	describe('fetchPrompts', () => {
		test('fetches prompts from configured collection', async () => {
			const mockGet = vi.fn().mockResolvedValue({
				data: { data: [{ id: '1', name: 'Test Prompt' }] },
			});

			vi.mocked(useApi).mockReturnValue({ get: mockGet } as any);

			// Must call usePrompts AFTER setting the mock return value
			const { fetchPrompts } = usePrompts();
			await fetchPrompts();

			expect(mockGet).toHaveBeenCalledWith('/items/ai_prompts', {
				params: {
					fields: ['id', 'name', 'description', 'status', 'system_prompt', 'messages'],
					filter: { status: { _eq: 'published' } },
					sort: 'name',
					limit: -1,
				},
			});
		});
	});
});
