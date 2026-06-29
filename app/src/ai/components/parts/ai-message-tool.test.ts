import { shallowMount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import AiMessageTool from './ai-message-tool.vue';
import AiToolCallCard from './ai-tool-call-card.vue';

vi.mock('@directus/format-title', () => ({ default: (value: string) => value }));

vi.mock('@/ai/stores/use-ai-tools', () => ({
	useAiToolsStore: () => ({ localTools: [] }),
}));

function mountTool(part: Record<string, unknown>) {
	return shallowMount(AiMessageTool, {
		props: { part } as never,
		global: {
			mocks: { $t: (key: string) => key },
		},
	});
}

describe('ai-message-tool tool name resolution', () => {
	// Directus tools run through the root `execute` tool. Approvals are keyed by the inner
	// tool name on the server, so the card must surface `input.name`, not "execute" — otherwise
	// "always approve" writes the wrong key and never takes effect.
	test('resolves an execute call to its inner tool name', () => {
		const wrapper = mountTool({
			type: 'tool-execute',
			state: 'approval-requested',
			input: { name: 'collections', input: { action: 'create' } },
		});

		expect(wrapper.findComponent(AiToolCallCard).props('toolName')).toBe('collections');
	});

	test('falls back to the part type for non-execute tools', () => {
		const wrapper = mountTool({
			type: 'tool-search',
			state: 'output-available',
			input: { query: 'collections' },
		});

		expect(wrapper.findComponent(AiToolCallCard).props('toolName')).toBe('search');
	});

	test('falls back to execute before the inner name has streamed in', () => {
		const wrapper = mountTool({
			type: 'tool-execute',
			state: 'input-streaming',
			input: undefined,
		});

		expect(wrapper.findComponent(AiToolCallCard).props('toolName')).toBe('execute');
	});
});
