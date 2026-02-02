import type { Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import VForm from './v-form.vue';
import { ClickOutside } from '@/__utils__/click-outside';
import { Md } from '@/__utils__/md';
import { Tooltip } from '@/__utils__/tooltip';
import { i18n } from '@/lang';

const global = {
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
	directives: {
		'click-outside': ClickOutside,
		md: Md,
		tooltip: Tooltip,
	},
};

vi.mock('./composables/use-ai-tools', () => ({
	useAiTools: vi.fn(() => ({})),
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
});

function createField(overrides: Partial<Field> = {}): Field {
	return {
		field: 'test_field',
		name: 'Test Field',
		type: 'string',
		collection: 'test_collection',
		schema: {
			name: 'test_field',
			table: 'test_collection',
			data_type: 'varchar',
			default_value: null,
			max_length: 255,
			numeric_precision: null,
			numeric_scale: null,
			is_nullable: true,
			is_unique: false,
			is_indexed: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_column: null,
			foreign_key_table: null,
			is_generated: false,
			generation_expression: null,
		},
		meta: {
			id: 1,
			collection: 'test_collection',
			field: 'test_field',
			special: null,
			interface: 'input',
			options: null,
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 1,
			width: 'full',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			searchable: true,
			validation_message: null,
		},
		...overrides,
	};
}

describe('VForm', () => {
	describe('apply function', () => {
		test('should preserve field values from updates even when field is readonly', async () => {
			const checkboxField = createField({
				field: 'checkbox',
				name: 'Checkbox',
				type: 'boolean',
				meta: {
					...createField().meta!,
					field: 'checkbox',
					special: ['cast-boolean'],
				},
			});

			const inputField = createField({
				field: 'input',
				name: 'Input',
				meta: {
					...createField().meta!,
					field: 'input',
					readonly: true,
				},
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [checkboxField, inputField],
					modelValue: { checkbox: false, input: 'preserved value' },
					primaryKey: '+',
				},
				global,
			});

			// Simulate an apply event (as would come from a nested group)
			// where the input field has a value but is currently readonly
			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			// Call apply with updates that include the readonly field's value
			vm.apply({ checkbox: true, input: 'preserved value' });

			await nextTick();

			// The emitted value should preserve the input value
			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ checkbox: true, input: 'preserved value' });
		});

		test('should only accept keys that are actual form fields', async () => {
			const inputField = createField({
				field: 'input',
				name: 'Input',
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [inputField],
					modelValue: { input: 'value' },
					primaryKey: '+',
				},
				global,
			});

			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			vm.apply({ input: 'new value', key: 'should be ignored' });

			await nextTick();

			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ input: 'new value' });
		});

		test('should preserve meta keys starting with $', async () => {
			const inputField = createField({
				field: 'input',
				name: 'Input',
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [inputField],
					modelValue: { input: 'value' },
					primaryKey: '+',
				},
				global,
			});

			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			vm.apply({ input: 'new value', $type: 'created' });

			await nextTick();

			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ input: 'new value', $type: 'created' });
		});
	});
});
