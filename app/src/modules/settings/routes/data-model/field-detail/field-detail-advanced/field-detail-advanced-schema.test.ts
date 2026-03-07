import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { useFieldDetailStore } from '../store';
import FieldDetailAdvancedSchema from './field-detail-advanced-schema.vue';

const i18n = createI18n({ legacy: false });

vi.spyOn(i18n.global, 't').mockImplementation((key: any) => key);

describe('FieldDetailAdvancedSchema', () => {
	beforeEach(() => {
		const pinia = createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		});

		setActivePinia(pinia);
	});

	it('keeps null defaults for nullable string fields', async () => {
		const { wrapper, fieldDetailStore } = mountWithField({ type: 'string', isNullable: true });

		await wrapper.get('input[placeholder="NULL"]').setValue('');

		expect(fieldDetailStore.field.schema?.default_value).toBeNull();
	});

	it.each(['string', 'text'])('stores empty string defaults for non-nullable %s fields', async (type) => {
		const { wrapper, fieldDetailStore } = mountWithField({ type, isNullable: false });
		const selector = type === 'text' ? 'textarea[placeholder="NULL"]' : 'input[placeholder="NULL"]';

		await wrapper.get(selector).setValue('');

		expect(fieldDetailStore.field.schema?.default_value).toBe('');
	});
});

function mountWithField({ type, isNullable }: { type: 'string' | 'text'; isNullable: boolean }) {
	const fieldDetailStore = useFieldDetailStore();

	fieldDetailStore.$patch({
		localType: 'standard',
		field: {
			collection: 'articles',
			field: 'title',
			type,
			schema: {
				default_value: 'seed',
				is_nullable: isNullable,
				is_primary_key: false,
				is_generated: false,
			},
			meta: {},
		},
	});

	const wrapper = mount(FieldDetailAdvancedSchema, {
		global: {
			plugins: [i18n],
			directives: {
				focus: () => undefined,
				tooltip: () => undefined,
			},
			stubs: {
				InterfaceInputCode: true,
				VCheckbox: true,
				VIcon: true,
				VSelect: true,
			},
		},
	});

	return { wrapper, fieldDetailStore };
}
