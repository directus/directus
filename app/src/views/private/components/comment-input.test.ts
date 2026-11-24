import type { Comment } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import CommentInput from './comment-input.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import VTemplateInput from '@/components/v-template-input.vue';
import { i18n } from '@/lang';

vi.mock('@/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const global: GlobalMountOptions = {
	plugins: [i18n],
	stubs: {
		VMenu: { template: '<div><slot name="activator" /></div>' },
		VTemplateInput: true,
		VEmojiPicker: true,
		VButton: true,
		VIcon: true,
	},
};

describe('comment-input', () => {
	test('passes the raw comment to the editor when editing', () => {
		const comment = '**bold** <form><input type=password></form>';

		const wrapper = mount(CommentInput, {
			props: {
				refresh: vi.fn(),
				collection: 'articles',
				primaryKey: 1,
				existingComment: { id: '1', comment } as Comment,
			},
			global,
		});

		expect(wrapper.findComponent(VTemplateInput).props('modelValue')).toBe(comment);
	});
});
