import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import type { Field, ValidationError } from '@directus/types';
import { mount } from '@vue/test-utils';
import { expect, test, describe, it } from 'vitest';
import ValidationErrors from './validation-errors.vue';

const global: GlobalMountOptions = {
	plugins: [i18n],
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
	const baseField: Field = {
		collection: 'posts',
		name: 'Title',
		field: 'title',
		type: 'string',
		schema: {
			name: 'title',
			table: 'posts',
			data_type: 'varchar',
			default_value: null,
			max_length: 255,
			numeric_precision: null,
			numeric_scale: null,
			is_generated: false,
			generation_expression: null,
			is_nullable: true,
			is_unique: false,
			is_indexed: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_column: null,
			foreign_key_table: null,
		},
		meta: {
			id: 1,
			collection: 'posts',
			field: 'title',
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
			validation_message: null,
		},
	};

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
							...baseField.meta,
							validation: customValidationRule,
							validation_message: 'my custom message',
						},
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
							...baseField.meta,
							validation: null,
							validation_message: 'my custom message',
							required: true,
						},
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
							...baseField.meta,
							validation: customValidationRule,
							validation_message: 'my custom message',
							required: true,
						},
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
							...baseField.meta,
							validation: customValidationRule,
							validation_message: 'my custom message',
							required: true,
						},
					} as Field,
				],
			},
			global,
		});

		expect(wrapper.html()).toContain('my custom message');
		expect(wrapper.html()).toContain('Value is required');
	});
});
