import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import GroupDetail from './group-detail.vue';

const global: GlobalMountOptions = {
	plugins: [i18n],
};

describe('group detail comparison indicator', () => {
	it('should render the diff-indicator class when closed on start', () => {
		const wrapper = mount(GroupDetail, {
			global,
			props,
		});

		expect(wrapper.html()).toContain('diff-indicator');
	});

	it('should render the diff-guide class when opened on start', () => {
		const wrapper = mount(GroupDetail, {
			global,
			props: {
				...props,
				start: 'open',
			},
		});

		expect(wrapper.html()).toContain('diff-guide');
	});

	it('should render the diff-guide class when there are no field differences but updates exist in the revision', () => {
		const wrapper = mount(GroupDetail, {
			global,
			props: {
				...props,
				comparison: {
					...props.comparison,
					fields: new Set(),
				},
			},
		});

		expect(wrapper.html()).toContain('diff-guide');
	});

	const props = {
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
			comparisonType: 'revision',
		},
	};
});
