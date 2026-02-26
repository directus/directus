import type { FileUIPart } from 'ai';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import AiMessageFileGroup from './ai-message-file-group.vue';

function makeFilePart(overrides: Partial<FileUIPart> = {}): FileUIPart {
	return {
		type: 'file',
		filename: 'file.png',
		mediaType: 'image/png',
		url: 'https://example.com/file.png',
		...overrides,
	} as FileUIPart;
}

describe('AiMessageFileGroup', () => {
	test('renders image groups as a grid for multiple previewable images', () => {
		const wrapper = shallowMount(AiMessageFileGroup, {
			props: {
				parts: [makeFilePart(), makeFilePart({ filename: 'two.png' }), makeFilePart({ filename: 'three.png' })],
			},
			global: {
				mocks: {
					$t: (key: string) => key,
				},
			},
		});

		expect(wrapper.find('.message-file-grid').exists()).toBe(true);
		expect(wrapper.findAll('.grid-item')).toHaveLength(3);
		expect(wrapper.findAllComponents({ name: 'AiMessageFile' })).toHaveLength(0);
	});

	test('falls back to single-file renderer for one image', () => {
		const wrapper = shallowMount(AiMessageFileGroup, {
			props: {
				parts: [makeFilePart()],
			},
			global: {
				mocks: {
					$t: (key: string) => key,
				},
			},
		});

		expect(wrapper.find('.message-file-grid').exists()).toBe(false);
		expect(wrapper.findAllComponents({ name: 'AiMessageFile' })).toHaveLength(1);
	});

	test('falls back to single-file renderer for mixed file types', () => {
		const wrapper = shallowMount(AiMessageFileGroup, {
			props: {
				parts: [makeFilePart(), makeFilePart({ filename: 'doc.pdf', mediaType: 'application/pdf' })],
			},
			global: {
				mocks: {
					$t: (key: string) => key,
				},
			},
		});

		expect(wrapper.find('.message-file-grid').exists()).toBe(false);
		expect(wrapper.findAllComponents({ name: 'AiMessageFile' })).toHaveLength(2);
	});
});
