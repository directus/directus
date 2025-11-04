import type { GlobalMountOptions } from '@/__utils__/types';
import VDetail from '@/components/v-detail.vue';
import { ComparisonContext } from '@/components/v-form/types';
import { i18n } from '@/lang';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import GroupDetail from './group-detail.vue';

const global: GlobalMountOptions = {
	plugins: [i18n],
	stubs: {
		VDetail,
	},
};

describe('group detail interface', () => {
	it('should render the edited class when having edits', async () => {
		const wrapper = mount(GroupDetail, {
			global,
			props: {
				...props,
				values: {
					headline: 'edited content',
				},
			},
		});

		expect(wrapper.find('v-divider').classes()).toContain('edited');
	});

	it('should not render the edited class when having no edits', async () => {
		const wrapper = mount(GroupDetail, {
			global,
			props,
		});

		expect(wrapper.find('v-divider').classes()).not.toContain('edited');
	});
});

describe('group detail comparison indicator', () => {
	it('should render the indicator-active class when closed on start', () => {
		const wrapper = mount(GroupDetail, {
			global,
			props,
		});

		expect(wrapper.html()).toContain('indicator-active');
	});

	it('should render the indicator-muted class when opened on start', () => {
		const wrapper = mount(GroupDetail, {
			global,
			props: {
				...props,
				start: 'open',
			},
		});

		expect(wrapper.html()).toContain('indicator-muted');
	});

	it('should render the indicator-muted class when there are no field differences but updates exist in the revision', () => {
		const wrapper = mount(GroupDetail, {
			global,
			props: {
				...props,
				comparison: {
					...props.comparison,
					fields: new Set([]),
				} as ComparisonContext,
			},
		});

		expect(wrapper.html()).toContain('indicator-muted');
	});
});

const props: InstanceType<typeof GroupDetail>['$props'] = {
	field: {
		collection: 'groups',
		field: 'detail',
		type: 'alias',
		schema: null,
		meta: {
			id: 216,
			collection: 'groups',
			field: 'detail',
			special: ['alias', 'no-data', 'group'],
			interface: 'group-detail',
			options: {},
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 3,
			width: 'full',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
			searchable: true,
		},
		name: 'Detail',
	},
	fields: [
		{
			collection: 'groups',
			field: 'description',
			type: 'string',
			schema: {
				name: 'description',
				table: 'groups',
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
				id: 221,
				collection: 'groups',
				field: 'description',
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
				group: 'detail',
				validation: null,
				validation_message: null,
				searchable: true,
			},
			name: 'Description',
		},
		{
			collection: 'groups',
			field: 'headline',
			type: 'string',
			schema: {
				name: 'headline',
				table: 'groups',
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
				id: 222,
				collection: 'groups',
				field: 'headline',
				special: null,
				interface: 'input',
				options: null,
				display: null,
				display_options: null,
				readonly: false,
				hidden: false,
				sort: 2,
				width: 'full',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: 'detail',
				validation: null,
				validation_message: null,
				searchable: true,
			},
			name: 'Headline',
		},
	],
	values: {},
	initialValues: {
		id: 1,
		description: 'content',
		headline: 'content',
	},
	primaryKey: '1',
	disabled: false,
	batchMode: false,
	batchActiveFields: [],
	loading: false,
	validationErrors: [],
	start: 'closed',
	comparison: {
		side: 'incoming',
		fields: new Set(['description', 'headline']),
		revisionFields: new Set(['title', 'headline']),
		selectedFields: ['description', 'headline'],
		onToggleField: () => {},
	},
};
