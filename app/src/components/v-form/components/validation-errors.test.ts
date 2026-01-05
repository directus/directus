import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import type { Field, FieldMeta, ValidationError } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it, test } from 'vitest';
import VNotice from '@/components/v-notice.vue';
import ValidationErrors from './validation-errors.vue';
import ValidationNestedGroups from './validation-nested-groups.vue';

const global: GlobalMountOptions = {
	plugins: [i18n],
	stubs: {
		'v-icon': {
			name: 'v-icon',
			template: '<span class="v-icon"><slot /></span>',
		},
		'v-notice': VNotice,
		'v-detail': {
			template:
				'<div class="v-detail"><slot name="activator" :active="true" :toggle="() => {}" /><div class="content"><slot /></div></div>',
		},
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

describe('Nested validation groups display', () => {
	it('shows custom validation message in the nested validation header when available', () => {
		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [
					{
						field: 'title',
						path: [],
						type: 'contains',
						substring: 'foo',
						hidden: false,
						group: null,
					} as unknown as ValidationError,
				],
				fields: [
					{
						collection: 'posts',
						name: 'Title',
						field: 'title',
						type: 'string',
						meta: {
							validation: { _and: [{ _or: [{ title: { _contains: 'foo' } }, { title: { _contains: 'bar' } }] }] },
							validation_message: 'My custom validation header',
						} as unknown as FieldMeta,
					} as Field,
				],
			},
			global,
		});

		expect(wrapper.text()).toContain('My custom validation header');
	});

	it('prefixes sibling rules with All/Any of the following', () => {
		const globalWithDetail: GlobalMountOptions = {
			plugins: [i18n],
		};

		const wrapperAnd = mount(ValidationNestedGroups, {
			props: {
				node: {
					type: 'and',
					children: [
						{ type: 'rule', field: 'title', operator: 'contains', value: 'foo' },
						{ type: 'rule', field: 'title', operator: 'contains', value: 'bar' },
					],
				},
			},
			global: globalWithDetail,
		});

		const andLines = wrapperAnd
			.findAll('.rule')
			.map((el) => el.text().trim())
			.filter(Boolean);

		const andLineLowercase = andLines[0]?.toLowerCase();
		expect(andLineLowercase).toBe('all of the following');
		expect(andLines).toContain('Value has to contain "foo"');
		expect(andLines).toContain('Value has to contain "bar"');

		const wrapperOr = mount(ValidationNestedGroups, {
			props: {
				node: {
					type: 'or',
					children: [
						{ type: 'rule', field: 'title', operator: 'contains', value: 'foo' },
						{ type: 'rule', field: 'title', operator: 'contains', value: 'bar' },
					],
				},
			},
			global: globalWithDetail,
		});

		const orLines = wrapperOr
			.findAll('.rule')
			.map((el) => el.text().trim())
			.filter(Boolean);

		const orLineLowercase = orLines[0]?.toLowerCase();
		expect(orLineLowercase).toBe('any of the following');
		expect(orLines).toContain('Value has to contain "foo"');
		expect(orLines).toContain('Value has to contain "bar"');
	});

	it('shows field names when validation rules reference other fields', () => {
		const wrapper = mount(ValidationErrors, {
			props: {
				validationErrors: [
					{
						field: 'subtitle',
						path: [],
						type: 'contains',
						substring: 'Hello',
						hidden: false,
						group: null,
					} as unknown as ValidationError,
				],
				fields: [
					{
						collection: 'posts',
						name: 'Subtitle',
						field: 'subtitle',
						type: 'string',
						meta: {
							validation: {
								_and: [
									{
										_and: [
											{
												subtitle: {
													_contains: 'Hello',
												},
											},
											{
												tagline: {
													_contains: 'World',
												},
											},
										],
									},
								],
							},
							validation_message: 'Subtitle does not satisfy our crazy long validation rule!',
						} as unknown as FieldMeta,
					} as Field,
					{
						collection: 'posts',
						name: 'Tagline',
						field: 'tagline',
						type: 'string',
						meta: {
							validation: {
								_and: [
									{
										tagline: {
											_contains: 'tag',
										},
									},
								],
							},
						} as unknown as FieldMeta,
					} as Field,
				],
			},
			global,
		});

		const text = wrapper.text();

		expect(text).toContain('Subtitle');
		expect(text).toContain('Subtitle does not satisfy our crazy long validation rule!');

		const ruleTexts = wrapper
			.findAll('.rule')
			.map((el) => el.text().trim())
			.filter(
				(text) =>
					text &&
					!text.toLowerCase().includes('all of the following') &&
					!text.toLowerCase().includes('any of the following'),
			);

		expect(ruleTexts.length).toBeGreaterThanOrEqual(2);
		const taglineRuleText = ruleTexts.find((text) => text.includes('World'));
		expect(taglineRuleText).toBeDefined();
		expect(taglineRuleText).toEqual('Tagline: Value has to contain "World"');
	});
});
