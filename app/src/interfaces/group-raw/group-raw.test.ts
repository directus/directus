import type { Field } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import GroupRaw from './group-raw.vue';
import type { GlobalMountOptions } from '@/__utils__/types.d.ts';
import VForm from '@/components/v-form/v-form.vue';

const global: GlobalMountOptions = {
	stubs: {
		VForm: true,
	},
};

const baseProps = {
	field: { meta: { field: 'my_group' } } as Field,
	fields: [] as Field[],
	values: {},
	initialValues: {},
	primaryKey: '1',
};

describe('group-raw', () => {
	it('forwards version prop to inner VForm', () => {
		const version = { id: 'abc', key: 'draft', collection: 'articles', item: '1' };

		const wrapper = mount(GroupRaw, {
			props: { ...baseProps, version: version as any },
			global,
		});

		const form = wrapper.findComponent(VForm);
		expect(form.props('version')).toEqual(version);
	});

	it('passes null version to inner VForm when not provided', () => {
		const wrapper = mount(GroupRaw, {
			props: baseProps,
			global,
		});

		const form = wrapper.findComponent(VForm);
		expect(form.props('version')).toBeNull();
	});
});
