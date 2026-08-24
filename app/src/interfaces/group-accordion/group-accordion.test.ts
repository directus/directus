import type { Field } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import GroupAccordion from './group-accordion.vue';
import type { GlobalMountOptions } from '@/__utils__/types.d.ts';
import VForm from '@/components/v-form/v-form.vue';
import { i18n } from '@/lang';

const groupFieldName = 'my_group';

// A field that belongs to the group, so AccordionSection renders
const childField: Field = {
	field: 'title',
	collection: 'articles',
	name: 'Title',
	type: 'string',
	schema: null,
	meta: { group: groupFieldName } as any,
};

const groupField: Field = {
	field: groupFieldName,
	collection: 'articles',
	name: 'My Group',
	type: 'alias',
	schema: null,
	meta: { field: groupFieldName, special: ['group'], interface: 'group-accordion' } as any,
};

const baseProps = {
	field: groupField,
	fields: [groupField, childField],
	values: {},
	initialValues: {},
	primaryKey: '1',
};

// Stub VItem to always render slot with active=true so the inner VForm is mounted
const global: GlobalMountOptions = {
	stubs: {
		VItemGroup: { template: '<div><slot /></div>' },
		VItem: { template: '<div><slot :active="true" :toggle="() => {}" /></div>' },
		TransitionExpand: { template: '<div><slot /></div>' },
		VForm: true,
		VIcon: true,
		VChip: true,
	},
	plugins: [i18n],
	directives: {
		tooltip: () => {},
	},
};

describe('group-accordion', () => {
	it('forwards version through AccordionSection to inner VForm', () => {
		const version = { id: 'abc', key: 'draft', collection: 'articles', item: '1' };

		const wrapper = mount(GroupAccordion, {
			props: { ...baseProps, version: version as any },
			global,
		});

		const form = wrapper.findComponent(VForm);
		expect(form.props('version')).toEqual(version);
	});
});
