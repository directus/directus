import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { computed } from 'vue';
import TranslationForm from './translation-form.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

vi.mock('@/composables/use-permissions', () => ({
	usePermissions: () => ({
		itemPermissions: {
			saveAllowed: computed(() => true),
			deleteAllowed: computed(() => true),
			fields: computed(() => [{ field: 'title' }, { field: 'slug' }, { field: 'description' }]),
		},
	}),
}));

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VDivider: true,
		VForm: {
			props: ['primaryKey', 'fields', 'disabled'],
			template: `
				<div data-testid="v-form" :data-primary-key="primaryKey" :data-disabled="String(disabled)">
					<div
						v-for="field in fields"
						:key="field.field"
						class="field"
						:data-field="field.field"
						:data-readonly="String(field.meta?.readonly === true)"
					>
						<div class="interface">
							<div class="v-input">
								<div class="input" :data-surface-field="field.field" />
							</div>
						</div>
					</div>
				</div>
			`,
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
		await flushPromises();

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
		await flushPromises();

		const vForm = wrapper.find('[data-testid="v-form"]');

		expect(vForm.exists()).toBe(true);
		expect(vForm.attributes('data-primary-key')).toBe('123');
	});

	test('applies queued and active translation classes to the matching fields', async () => {
		const translationJob = {
			pendingLanguages: computed(() => new Set(['fr'])),
			getActiveField: vi.fn(() => 'slug'),
			getQueuedFields: vi.fn(() => ['description']),
		} as any;

		const wrapper = mount(TranslationForm, {
			props: {
				lang: 'fr',
				languageOptions: [{ value: 'fr', text: 'French' }],
				relationInfo: { junctionPrimaryKeyField: { field: 'id' } } as any,
				getItemWithLang: () => ({ id: 1 }),
				displayItems: [],
				fetchedItems: [{ id: 1 }],
				getItemEdits: () => ({}),
				isLocalItem: () => false,
				remove: vi.fn(),
				updateValue: vi.fn(),
				translationJob,
			},
			global,
		});

		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();

		expect(wrapper.find('.field[data-field="slug"]').classes()).not.toContain('translation-field-active');
		expect(wrapper.find('.field[data-field="description"]').classes()).not.toContain('translation-field-queued');
		expect(wrapper.find('[data-surface-field="title"]').classes()).not.toContain('translation-field-active');
		expect(wrapper.find('[data-surface-field="title"]').classes()).not.toContain('translation-field-queued');
		expect(wrapper.find('[data-surface-field="slug"]').classes()).toContain('translation-field-active');
		expect(wrapper.find('[data-surface-field="description"]').classes()).toContain('translation-field-queued');
	});

	test('keeps completed fields editable while later fields remain locked', async () => {
		const translationJob = {
			pendingLanguages: computed(() => new Set(['fr'])),
			getActiveField: vi.fn(() => 'slug'),
			getQueuedFields: vi.fn(() => ['description']),
		} as any;

		const wrapper = mount(TranslationForm, {
			props: {
				lang: 'fr',
				languageOptions: [{ value: 'fr', text: 'French' }],
				relationInfo: { junctionPrimaryKeyField: { field: 'id' } } as any,
				getItemWithLang: () => ({ id: 1 }),
				displayItems: [],
				fetchedItems: [{ id: 1 }],
				getItemEdits: () => ({}),
				isLocalItem: () => false,
				remove: vi.fn(),
				updateValue: vi.fn(),
				translationJob,
			},
			global,
		});

		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();

		expect(wrapper.find('[data-testid="v-form"]').attributes('data-disabled')).toBe('false');
		expect(wrapper.find('.field[data-field="title"]').attributes('data-readonly')).toBe('false');
		expect(wrapper.find('.field[data-field="slug"]').attributes('data-readonly')).toBe('true');
		expect(wrapper.find('.field[data-field="description"]').attributes('data-readonly')).toBe('true');
	});
});
