import { shallowMount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import AiMessage from './ai-message.vue';

vi.mock('../composables/use-visual-element-highlight', () => ({
	useVisualElementHighlight: () => ({
		highlight: vi.fn(),
		clearHighlight: vi.fn(),
	}),
}));

function makeImagePart(filename: string) {
	return {
		type: 'file',
		filename,
		mediaType: 'image/png',
		url: `https://example.com/${filename}`,
	};
}

describe('AiMessage', () => {
	test('groups consecutive file parts into one render block', () => {
		const wrapper = shallowMount(AiMessage, {
			props: {
				role: 'assistant',
				parts: [
					{ type: 'text', text: 'before' },
					makeImagePart('one.png'),
					makeImagePart('two.png'),
					{ type: 'text', text: 'after' },
				],
			},
			global: {
				directives: {
					tooltip: () => {},
				},
			},
		});

		const fileGroups = wrapper.findAllComponents({ name: 'AiMessageFileGroup' });

		expect(fileGroups).toHaveLength(1);
		expect((fileGroups[0]?.props('parts') as unknown[]) ?? []).toHaveLength(2);
		expect(wrapper.findAll('ai-message-text-stub')).toHaveLength(2);
	});

	test('starts a new group when non-file content appears between files', () => {
		const wrapper = shallowMount(AiMessage, {
			props: {
				role: 'assistant',
				parts: [
					makeImagePart('one.png'),
					{ type: 'text', text: 'between' },
					makeImagePart('two.png'),
					makeImagePart('three.png'),
				],
			},
			global: {
				directives: {
					tooltip: () => {},
				},
			},
		});

		const fileGroups = wrapper.findAllComponents({ name: 'AiMessageFileGroup' });
		const firstGroupParts = (fileGroups[0]?.props('parts') as unknown[]) ?? [];
		const secondGroupParts = (fileGroups[1]?.props('parts') as unknown[]) ?? [];

		expect(fileGroups).toHaveLength(2);
		expect(firstGroupParts).toHaveLength(1);
		expect(secondGroupParts).toHaveLength(2);
	});
});
