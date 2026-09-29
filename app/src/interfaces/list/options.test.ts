import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import Repeater from './list.vue';
import Options from './options.vue';
import { i18n } from '@/lang';

const fields = [
	{
		field: 'street',
		name: 'Street',
		type: 'string',
		meta: { interface: 'input', width: 'full' },
	},
	{
		field: 'city',
		name: 'City',
		type: 'string',
		meta: { interface: 'input', width: 'half' },
	},
];

function mountOptions() {
	return mount(Options, {
		global: { plugins: [i18n, createPinia()], stubs: { VInput: { render: () => null } } },
		props: { value: { fields }, collection: 'test' },
		shallow: true,
	}) as VueWrapper;
}

describe('list options', () => {
	it('exposes the field key and type of sub-fields that do not repeat them in their meta', () => {
		const wrapper = mountOptions();

		expect(wrapper.findComponent(Repeater).props('value')).toEqual([
			{ field: 'street', type: 'string', interface: 'input', width: 'full' },
			{ field: 'city', type: 'string', interface: 'input', width: 'half' },
		]);
	});

	it('keeps the field key and type of those sub-fields when saving', () => {
		const wrapper = mountOptions();
		const repeater = wrapper.findComponent(Repeater);

		repeater.vm.$emit('input', repeater.props('value'));

		expect(wrapper.emitted('input')![0]![0]).toEqual({
			fields: [
				{
					field: 'street',
					name: 'street',
					type: 'string',
					meta: { field: 'street', type: 'string', interface: 'input', width: 'full' },
				},
				{
					field: 'city',
					name: 'city',
					type: 'string',
					meta: { field: 'city', type: 'string', interface: 'input', width: 'half' },
				},
			],
		});
	});
});
