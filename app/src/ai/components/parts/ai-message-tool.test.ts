import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import AiMessageTool from './ai-message-tool.vue';

vi.mock('@directus/format-title', () => ({ default: (value: string) => value }));

const toolsStore = vi.hoisted(() => ({
	localTools: [] as Array<{ name: string; displayName: string }>,
}));

vi.mock('@/ai/stores/use-ai-tools', () => ({
	useAiToolsStore: () => toolsStore,
}));

function mountTool(part: Record<string, unknown>) {
	return shallowMount(AiMessageTool, {
		props: { part } as never,
		global: {
			mocks: { $t: (key: string) => key },
		},
	});
}

const AiToolCallCardStub = defineComponent({
	name: 'AiToolCallCard',
	props: ['approval', 'state', 'toolName'],
	template: '<section><slot name="title" /><slot name="error" /><slot name="content" /></section>',
});

const VTextOverflowStub = defineComponent({
	name: 'VTextOverflow',
	props: ['text'],
	template: '<span>{{ text }}</span>',
});

function mountRenderedTool(part: Record<string, unknown>) {
	return shallowMount(AiMessageTool, {
		props: { part } as never,
		global: {
			mocks: { $t: (key: string) => key },
			stubs: {
				AiToolCallCard: AiToolCallCardStub,
				VTextOverflow: VTextOverflowStub,
			},
		},
	});
}

beforeEach(() => {
	toolsStore.localTools = [];
});

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

		expect(wrapper.findComponent({ name: 'AiToolCallCard' }).props('toolName')).toBe('collections');
	});

	test('falls back to the part type for non-execute tools', () => {
		const wrapper = mountTool({
			type: 'tool-search',
			state: 'output-available',
			input: { query: 'collections' },
		});

		expect(wrapper.findComponent({ name: 'AiToolCallCard' }).props('toolName')).toBe('search');
	});

	test('falls back to execute before the inner name has streamed in', () => {
		const wrapper = mountTool({
			type: 'tool-execute',
			state: 'input-streaming',
			input: undefined,
		});

		expect(wrapper.findComponent({ name: 'AiToolCallCard' }).props('toolName')).toBe('execute');
	});

	test('uses local tool display names when available', () => {
		toolsStore.localTools = [{ name: 'client-tool', displayName: 'Client Tool' }];

		const wrapper = mountRenderedTool({
			type: 'tool-client-tool',
			state: 'input-available',
			input: {},
		});

		expect(wrapper.findComponent({ name: 'VTextOverflow' }).props('text')).toBe('Client Tool');
	});

	test('shows unwrapped execute input', () => {
		const wrapper = mountRenderedTool({
			type: 'tool-execute',
			state: 'input-available',
			input: { name: 'collections', input: { action: 'create' } },
		});

		const inputText = wrapper.find('.tool-input code').text();

		expect(inputText).toBe('{\n  "action": "create"\n}');
		expect(inputText).not.toContain('collections');
	});

	test('shows direct input for non-execute tools', () => {
		const wrapper = mountRenderedTool({
			type: 'tool-search',
			state: 'input-available',
			input: { query: 'collections' },
		});

		expect(wrapper.find('.tool-input code').text()).toBe('{\n  "query": "collections"\n}');
	});
});
