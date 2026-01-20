import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import VUpload from './v-upload.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

vi.mock('@/stores/files', () => ({
	useFilesStore: () => ({
		upload: vi.fn(() => ({ uploading: computed(() => false) })),
	}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VButton: true,
		DrawerCollection: true,
	},
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
};

describe('Component', () => {
	it('should mount', () => {
		const wrapper = mount(VUpload, {
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render disabled class when disabled', () => {
		const wrapper = mount(VUpload, {
			props: {
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.v-upload').classes()).toContain('disabled');
	});

	it('should render action buttons disabled when disabled', () => {
		const wrapper = mount(VUpload, {
			props: {
				fromLibrary: true,
				disabled: true,
			},
			global,
		});

		const buttons = wrapper.findAll('.actions v-button-stub');

		buttons.forEach((button) => {
			expect(button.attributes('disabled')).toBe('true');
		});
	});
});
