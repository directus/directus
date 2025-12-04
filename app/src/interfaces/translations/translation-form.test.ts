import { mount } from '@vue/test-utils';
import type { GlobalMountOptions } from '@/__utils__/types';
import { describe, expect, test, vi } from 'vitest';
import TranslationForm from './translation-form.vue';

vi.mock('@/composables/use-permissions', () => ({
	usePermissions: () => ({
		itemPermissions: {},
	}),
}));

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VDivider: true,
		VForm: {
			props: ['primaryKey'],
			template: '<div data-testid="v-form" :data-primary-key="primaryKey" />',
		},
		LanguageSelect: true,
		VRemove: true,
	},
	directives: {
		tooltip: () => {},
	},
};

describe('translation-form', () => {
	test('forwards "+" as primaryKey to v-form when no existing translation', async () => {
		const wrapper = mount(TranslationForm, {
			props: {
				languageOptions: [{ value: 'en' }],
				relationInfo: { junctionPrimaryKeyField: { field: 'id' } } as any,
				getItemWithLang: () => undefined,
				displayItems: [],
				fetchedItems: [],
				getItemEdits: () => ({}),
				isLocalItem: () => false,
				remove: vi.fn(),
				updateValue: vi.fn(),
			},
			global,
		});

		await wrapper.setProps({ lang: 'en' });
		await wrapper.vm.$nextTick();

		const vForm = wrapper.find('[data-testid="v-form"]');

		expect(vForm.exists()).toBe(true);
		expect(vForm.attributes('data-primary-key')).toBe('+');
	});

	test('forwards existing translation primaryKey to v-form', async () => {
		const existingItem = { id: 123, languages_id: 'en' };

		const wrapper = mount(TranslationForm, {
			props: {
				languageOptions: [{ value: 'en' }],
				relationInfo: { junctionPrimaryKeyField: { field: 'id' } } as any,
				getItemWithLang: () => existingItem,
				displayItems: [],
				fetchedItems: [existingItem],
				getItemEdits: () => ({}),
				isLocalItem: () => false,
				remove: vi.fn(),
				updateValue: vi.fn(),
			},
			global,
		});

		await wrapper.setProps({ lang: 'en' });
		await wrapper.vm.$nextTick();

		const vForm = wrapper.find('[data-testid="v-form"]');

		expect(vForm.exists()).toBe(true);
		expect(vForm.attributes('data-primary-key')).toBe('123');
	});
});
