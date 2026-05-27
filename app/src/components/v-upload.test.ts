import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import VUpload from './v-upload.vue';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

vi.mock('@/stores/files', () => ({
	useFilesStore: () => ({
		upload: vi.fn(() => ({ uploading: computed(() => false) })),
	}),
}));

beforeEach(() => {
	for (const id of ['menu-outlet', 'dialog-outlet']) {
		if (!document.getElementById(id)) {
			const el = document.createElement('div');
			el.id = id;
			document.body.appendChild(el);
		}
	}
});

afterEach(() => {
	for (const id of ['menu-outlet', 'dialog-outlet']) {
		const el = document.getElementById(id);
		if (el) el.remove();
	}

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
	directives: {
		tooltip: Tooltip,
	},
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
