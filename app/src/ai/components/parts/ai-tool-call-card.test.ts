import { shallowMount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import AiToolCallCard from './ai-tool-call-card.vue';

vi.mock('vue-i18n', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-i18n')>();

	return {
		...actual,
		useI18n: () => ({ t: (key: string) => key }),
	};
});

vi.mock('@/ai/stores/use-ai', () => ({
	useAiStore: () => ({
		approveToolCall: vi.fn(),
		denyToolCall: vi.fn(),
	}),
}));

vi.mock('@/ai/stores/use-ai-tools', () => ({
	useAiToolsStore: () => ({
		setToolApprovalMode: vi.fn(),
	}),
}));

function mountCard(props: Record<string, unknown> = {}) {
	return shallowMount(AiToolCallCard, {
		props: {
			state: 'output-available',
			toolName: 'test_tool',
			...props,
		},
	});
}

describe('ai-tool-call-card open/close behavior', () => {
	test('starts closed for completed tools', () => {
		const wrapper = mountCard({ state: 'output-available' });
		const root = wrapper.findComponent({ name: 'CollapsibleRoot' });
		expect(root.props('open')).toBe(false);
	});

	test('opens when state transitions to approval-requested', async () => {
		const wrapper = mountCard({ state: 'input-streaming' });
		const root = wrapper.findComponent({ name: 'CollapsibleRoot' });
		expect(root.props('open')).toBe(false);

		await wrapper.setProps({ state: 'approval-requested' });
		expect(root.props('open')).toBe(true);
	});

	test('closes when state transitions from approval-requested to output-available', async () => {
		const wrapper = mountCard({ state: 'approval-requested' });
		const root = wrapper.findComponent({ name: 'CollapsibleRoot' });
		expect(root.props('open')).toBe(true);

		await wrapper.setProps({ state: 'output-available' });
		expect(root.props('open')).toBe(false);
	});
});
