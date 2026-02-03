import type { Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
		it('preserves grouped readonly field values during nested form updates', async () => {
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

			const groupedInputField = createField({
				field: 'grouped_input',
				name: 'Grouped Input',
				meta: {
					...createField().meta!,
					field: 'grouped_input',
					readonly: true,
					group: 'my_group',
				},
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [checkboxField, groupedInputField],
					modelValue: { checkbox: false, grouped_input: 'preserved value' },
					primaryKey: '+',
				},
				global,
			});

			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			vm.apply({ checkbox: true, grouped_input: 'preserved value' });

			await nextTick();

			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ checkbox: true, grouped_input: 'preserved value' });
		});

		it('filters out keys that are not actual form fields', async () => {
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

		it('preserves meta keys starting with $', async () => {
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

		it('filters out top-level readonly field updates', async () => {
			const editableField = createField({
				field: 'editable',
				name: 'Editable',
			});

			const readonlyField = createField({
				field: 'readonly_field',
				name: 'Readonly Field',
				meta: {
					...createField().meta!,
					field: 'readonly_field',
					readonly: true,
				},
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [editableField, readonlyField],
					modelValue: { editable: 'old', readonly_field: 'should not change' },
					primaryKey: '+',
				},
				global,
			});

			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			vm.apply({ editable: 'new', readonly_field: 'CHANGED' });

			await nextTick();

			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ editable: 'new' });
		});

		it('allows hidden field updates (hidden is not readonly)', async () => {
			const visibleField = createField({
				field: 'visible',
				name: 'Visible',
			});

			const hiddenField = createField({
				field: 'hidden_field',
				name: 'Hidden Field',
				meta: {
					...createField().meta!,
					field: 'hidden_field',
					hidden: true,
				},
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [visibleField, hiddenField],
					modelValue: { visible: 'old', hidden_field: 'secret' },
					primaryKey: '+',
				},
				global,
			});

			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			vm.apply({ visible: 'new', hidden_field: 'updated' });

			await nextTick();

			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ visible: 'new', hidden_field: 'updated' });
		});

		it('filters out conditionally readonly field updates (not in a group)', async () => {
			const toggleField = createField({
				field: 'toggle',
				name: 'Toggle',
				type: 'boolean',
				meta: {
					...createField().meta!,
					field: 'toggle',
				},
			});

			const conditionalField = createField({
				field: 'conditional',
				name: 'Conditional',
				meta: {
					...createField().meta!,
					field: 'conditional',
					conditions: [
						{
							name: 'Make readonly',
							rule: { toggle: { _eq: true } },
							readonly: true,
							hidden: false,
							options: {},
						},
					],
				},
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [toggleField, conditionalField],
					modelValue: { toggle: true, conditional: 'original' },
					primaryKey: '+',
				},
				global,
			});

			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			vm.apply({ toggle: true, conditional: 'CHANGED' });

			await nextTick();

			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ toggle: true });
		});

		it('preserves grouped field values even when conditionally readonly', async () => {
			const toggleField = createField({
				field: 'toggle',
				name: 'Toggle',
				type: 'boolean',
				meta: {
					...createField().meta!,
					field: 'toggle',
				},
			});

			const groupedConditionalField = createField({
				field: 'grouped_conditional',
				name: 'Grouped Conditional',
				meta: {
					...createField().meta!,
					field: 'grouped_conditional',
					group: 'my_group',
					conditions: [
						{
							name: 'Make readonly',
							rule: { toggle: { _eq: true } },
							readonly: true,
							hidden: false,
							options: {},
						},
					],
				},
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [toggleField, groupedConditionalField],
					modelValue: { toggle: true, grouped_conditional: 'preserved value' },
					primaryKey: '+',
				},
				global,
			});

			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			vm.apply({ toggle: true, grouped_conditional: 'preserved value' });

			await nextTick();

			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ toggle: true, grouped_conditional: 'preserved value' });
		});

		it('allows editable field updates', async () => {
			const editableField = createField({
				field: 'editable',
				name: 'Editable',
				meta: {
					...createField().meta!,
					field: 'editable',
					readonly: false,
				},
			});

			const wrapper = mount(VForm, {
				props: {
					fields: [editableField],
					modelValue: { editable: 'old' },
					primaryKey: '+',
				},
				global,
			});

			const vm = wrapper.vm as unknown as {
				apply: (updates: Record<string, unknown>) => void;
			};

			vm.apply({ editable: 'new' });

			await nextTick();

			const emitted = wrapper.emitted('update:modelValue');
			expect(emitted).toBeTruthy();
			expect(emitted?.[0]?.[0]).toEqual({ editable: 'new' });
		});
	});
});
