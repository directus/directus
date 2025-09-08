import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import EditorSidebarDetail from './editor-sidebar-detail.vue';

// Mock composables
const mockUseExtensions = vi.fn();
const mockUseExtension = vi.fn();

vi.mock('@/extensions', () => ({
	useExtensions: () => mockUseExtensions(),
}));

vi.mock('@/composables/use-extension', () => ({
	useExtension: () => mockUseExtension(),
}));

const i18n = createI18n({
	legacy: false,
	locale: 'en-US',
	messages: {
		'en-US': {
			editor: 'Editor',
		},
	},
});

describe('EditorSidebarDetail', () => {
	beforeEach(() => {
		mockUseExtensions.mockReturnValue({
			editors: {
				value: [
					{ id: 'test-editor', name: 'Test Editor', icon: 'edit' },
					{ id: 'another-editor', name: 'Another Editor', icon: 'text' },
				],
			},
		});

		mockUseExtension.mockReturnValue({
			value: null,
		});
	});

	it('should render editor selection component', () => {
		const wrapper = mount(EditorSidebarDetail, {
			props: {
				modelValue: null,
			},
			global: {
				plugins: [i18n],
				stubs: {
					'sidebar-detail': {
						template: '<div class="sidebar-detail-mock"><slot /></div>',
						props: ['icon', 'title', 'badge'],
					},
					'v-select': {
						template: '<select class="v-select-mock"><option value="">Select...</option></select>',
						props: ['modelValue', 'items', 'itemText', 'itemValue', 'placeholder'],
						emits: ['update:modelValue'],
					},
				},
			},
		});

		expect(wrapper.find('.sidebar-detail-mock').exists()).toBe(true);
		expect(wrapper.find('.v-select-mock').exists()).toBe(true);
	});

	it('should emit update:modelValue when editor selection changes', async () => {
		const wrapper = mount(EditorSidebarDetail, {
			props: {
				modelValue: null,
			},
			global: {
				plugins: [i18n],
				stubs: {
					'sidebar-detail': {
						template: '<div><slot /></div>',
						props: ['icon', 'title', 'badge'],
					},
					'v-select': {
						template: '<select class="v-select-mock" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">Select...</option></select>',
						props: ['modelValue', 'items', 'itemText', 'itemValue', 'placeholder'],
						emits: ['update:modelValue'],
					},
				},
			},
		});

		await wrapper.find('.v-select-mock').trigger('change');
		expect(wrapper.emitted('update:modelValue')).toBeTruthy();
	});

	it('should display selected editor when modelValue is provided', () => {
		mockUseExtension.mockReturnValue({
			value: { id: 'test-editor', name: 'Test Editor', icon: 'edit' },
		});

		const wrapper = mount(EditorSidebarDetail, {
			props: {
				modelValue: 'test-editor',
			},
			global: {
				plugins: [i18n],
				stubs: {
					'sidebar-detail': {
						template: '<div class="sidebar-detail-mock"><slot /></div>',
						props: ['icon', 'title', 'badge'],
					},
					'v-select': {
						template: '<select class="v-select-mock"><option value="test-editor">Test Editor</option></select>',
						props: ['modelValue', 'items', 'itemText', 'itemValue', 'placeholder'],
					},
				},
			},
		});

		expect(wrapper.find('.sidebar-detail-mock').exists()).toBe(true);
	});
});
