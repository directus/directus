import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VDetail from './v-detail.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

afterEach(() => {
	vi.clearAllMocks();
});

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
	},
	plugins: [i18n],
};

describe('Component', () => {
	it('should mount', () => {
		const wrapper = mount(VDetail, { global });

		expect(wrapper.exists()).toBe(true);
	});

	it('should render chevron icon button disabled when disabled', () => {
		const wrapper = mount(VDetail, {
			props: {
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('v-icon-stub[name="chevron_right"]').exists()).toBe(true);
		expect(wrapper.find('v-icon-stub[name="chevron_right"]').attributes('disabled')).toBe('true');
	});
});
