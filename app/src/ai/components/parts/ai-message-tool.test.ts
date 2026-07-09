import { shallowMount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import AiMessageTool from './ai-message-tool.vue';

vi.mock('@directus/format-title', () => ({ default: (value: string) => value }));

vi.mock('@/ai/stores/use-ai-tools', () => ({
	useAiToolsStore: () => ({ localTools: [] }),
}));

const AiToolCallCardStub = defineComponent({
	name: 'AiToolCallCard',
	props: ['approval', 'state', 'toolName'],
	template: '<section><slot name="title" /><slot name="error" /><slot name="content" /></section>',
});

function mountTool(part: Record<string, unknown>) {
	return shallowMount(AiMessageTool, {
		props: { part } as never,
		global: {
			mocks: { $t: (key: string) => key },
			stubs: { AiToolCallCard: AiToolCallCardStub },
		},
	});
}

describe('ai-message-tool execute unwrapping', () => {
	// Approvals are keyed by the inner tool name on the server, so the card must surface
	// `input.name`, not "execute" — otherwise "always approve" writes the wrong key.
	test('resolves an execute call to its inner tool name and input', () => {
		const wrapper = mountTool({
			type: 'tool-execute',
			state: 'input-available',
			input: { name: 'collections', input: { action: 'create' } },
		});

		expect(wrapper.findComponent({ name: 'AiToolCallCard' }).props('toolName')).toBe('collections');

		const inputText = wrapper.find('.tool-input code').text();

		expect(inputText).toBe('{\n  "action": "create"\n}');
		expect(inputText).not.toContain('collections');
	});

	test('passes non-execute tools through unchanged', () => {
		const wrapper = mountTool({
			type: 'tool-search',
			state: 'input-available',
			input: { query: 'collections' },
		});

		expect(wrapper.findComponent({ name: 'AiToolCallCard' }).props('toolName')).toBe('search');
		expect(wrapper.find('.tool-input code').text()).toBe('{\n  "query": "collections"\n}');
	});

	test('falls back to execute before the inner name has streamed in', () => {
		const wrapper = mountTool({
			type: 'tool-execute',
			state: 'input-streaming',
			input: undefined,
		});

		expect(wrapper.findComponent({ name: 'AiToolCallCard' }).props('toolName')).toBe('execute');
	});
});
