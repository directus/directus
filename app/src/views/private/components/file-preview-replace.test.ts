import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FilePreviewReplace from './file-preview-replace.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	plugins: [i18n],
};

describe('Interface', () => {
	const file = { id: '1', title: 'Test File', type: 'image', modified_on: '2024-06-01', width: 100, height: 100 };

	it('should mount', () => {
		const wrapper = mount(FilePreviewReplace, {
			props: {
				file,
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should set .replace-toggle to disabled if disabled', () => {
		const wrapper = mount(FilePreviewReplace, {
			props: {
				file,
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.replace-toggle').attributes('disabled')).toBe('');
	});

	it('should not render .replace-toggle if nonEditable is true', () => {
		const wrapper = mount(FilePreviewReplace, {
			props: {
				file,
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.replace-toggle').exists()).toBe(false);
	});
});
