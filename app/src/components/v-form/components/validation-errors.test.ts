import type { Field, FieldMeta, ValidationError } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it, test } from 'vitest';
import ValidationErrors from './validation-errors.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import VNotice from '@/components/v-notice.vue';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	plugins: [i18n],
	stubs: {
		'v-icon': {
			name: 'v-icon',
			template: '<span class="v-icon"><slot /></span>',
		},
		'v-notice': VNotice,
	},
	directives: {
		tooltip: () => {},
	},
};

test('Mount component', () => {
	expect(ValidationErrors).toBeTruthy();

	const wrapper = mount(ValidationErrors, {
		props: {
			validationErrors: [],
			fields: [],
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

describe('Custom validation message', () => {
	const baseField = {
		collection: 'posts',
		name: 'Title',
		field: 'title',
		type: 'string',
	} as unknown as Field;

	const customValidationRule = { _and: [{ title: { _contains: 'a' } }] };

	const customValidationError = {
		field: 'title',
		path: [],
		type: 'contains',
		substring: 'a',
		hidden: false,
		group: null,
	} as unknown as ValidationError;

	const requiredValidationError = {
		field: 'title',
		path: [],
		type: 'nnull',
		hidden: false,
		group: null,
	} as unknown as ValidationError;

	it('appears when custom validation rule fails', () => {
		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [customValidationError],
				fields: [
					{
						...baseField,
						meta: {
							validation: customValidationRule,
							validation_message: 'my custom message',
						} as unknown as FieldMeta,
					} as Field,
				],
			},
			global,
		});

		expect(wrapper.html()).toContain('my custom message');
	});

	it('appears when required rule fails, but no custom validation rule exists', () => {
		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [requiredValidationError],
				fields: [
					{
						...baseField,
						meta: {
							validation_message: 'my custom message',
							required: true,
						} as FieldMeta,
					} as Field,
				],
			},
			global,
		});

		expect(wrapper.html()).toContain('my custom message');
	});

	it('does not appear when required rule fails and custom validation rule exists', () => {
		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [requiredValidationError],
				fields: [
					{
						...baseField,
						meta: {
							validation: customValidationRule,
							validation_message: 'my custom message',
							required: true,
						} as unknown as FieldMeta,
					} as Field,
				],
			},
			global,
		});

		expect(wrapper.html()).not.toContain('my custom message');
	});

	it('appears when required rule and custom validation rule fails', () => {
		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [customValidationError, requiredValidationError],
				fields: [
					{
						...baseField,
						meta: {
							validation: customValidationRule,
							validation_message: 'my custom message',
							required: true,
						} as unknown as FieldMeta,
					} as Field,
				],
			},
			global,
		});

		expect(wrapper.html()).toContain('my custom message');
		expect(wrapper.html()).toContain('Value is required');
	});
});

describe('Props updates', () => {
	it('updates when validationErrors prop changes', async () => {
		const fields = [{ field: 'name', name: 'Name' } as Field, { field: 'email', name: 'Email' } as Field];

		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [{ field: 'name', type: 'nnull' } as unknown as ValidationError],
				fields,
			},
			global,
		});

		expect(wrapper.html()).toContain('Name');

		await wrapper.setProps({ validationErrors: [{ field: 'email', type: 'nnull' } as unknown as ValidationError] });

		expect(wrapper.html()).toContain('Email');
		expect(wrapper.html()).not.toContain('Name');
	});

	it('updates when errors are added', async () => {
		const fields = [{ field: 'name', name: 'Name' } as Field];

		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [],
				fields,
			},
			global,
		});

		expect(wrapper.findAll('.validation-error')).toHaveLength(0);

		await wrapper.setProps({ validationErrors: [{ field: 'name', type: 'nnull' } as ValidationError] });

		expect(wrapper.findAll('.validation-error')).toHaveLength(1);
		expect(wrapper.html()).toContain('Name');
	});

	it('updates when errors are removed', async () => {
		const fields = [{ field: 'name', name: 'Name' } as Field, { field: 'email', name: 'Email' } as Field];

		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [
					{ field: 'name', type: 'nnull' } as unknown as ValidationError,
					{ field: 'email', type: 'nnull' } as unknown as ValidationError,
				],
				fields,
			},
			global,
		});

		expect(wrapper.findAll('.validation-error')).toHaveLength(2);

		await wrapper.setProps({ validationErrors: [{ field: 'email', type: 'nnull' } as unknown as ValidationError] });

		expect(wrapper.findAll('.validation-error')).toHaveLength(1);
		expect(wrapper.html()).toContain('Email');
		expect(wrapper.html()).not.toContain('Name');
	});

	it('updates when error types change', async () => {
		const fields = [
			{ field: 'name', name: 'Name', meta: { required: true } } as Field,
			{
				field: 'custom',
				name: 'Custom Field',
				meta: {
					validation: { _and: [{ custom: { _eq: 'value' } }] },
					validation_message: 'Custom message',
				} as Partial<FieldMeta>,
			} as Field,
		];

		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [{ field: 'name', type: 'nnull' } as unknown as ValidationError],
				fields,
			},
			global,
		});

		expect(wrapper.html()).toContain('Name');

		await wrapper.setProps({
			validationErrors: [
				{
					field: 'custom',
					type: 'eq',
					valid: 'value',
					validation_message: 'Custom message',
				} as unknown as ValidationError,
			],
		});

		expect(wrapper.html()).toContain('Custom Field');
		expect(wrapper.html()).toContain('Custom message');
	});

	it('updates when multiple errors change simultaneously', async () => {
		const fields = [
			{ field: 'name', name: 'Name' } as Field,
			{ field: 'email', name: 'Email' } as Field,
			{
				field: 'custom',
				name: 'Custom Field',
				meta: {
					validation: { _and: [{ custom: { _eq: 'value' } }] },
					validation_message: 'Custom message',
				} as Partial<FieldMeta>,
			} as Field,
		];

		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [
					{
						field: 'custom',
						type: 'eq',
						valid: 'value',
						validation_message: 'Custom message',
					} as unknown as ValidationError,
				],
				fields,
			},
			global,
		});

		expect(wrapper.findAll('.validation-error')).toHaveLength(1);
		expect(wrapper.html()).toContain('Custom Field');

		await wrapper.setProps({
			validationErrors: [
				{ field: 'name', type: 'nnull' } as unknown as ValidationError,
				{
					field: 'custom',
					type: 'eq',
					valid: 'value',
					validation_message: 'Custom message',
				} as unknown as ValidationError,
			],
		});

		expect(wrapper.findAll('.validation-error')).toHaveLength(2);
		expect(wrapper.html()).toContain('Name');
		expect(wrapper.html()).toContain('Custom Field');
	});
});
