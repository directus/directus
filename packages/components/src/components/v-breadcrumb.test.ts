import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VBreadcrumb from './v-breadcrumb.vue';
import { h } from 'vue';

const global = {
	components: {
		'v-icon': (props: any) => h('span', { class: 'icon' }, props.name),
		'router-link': (props: any, { slots }: any) => h('a', { href: props.to }, slots),
	},
};

test('Mount component', () => {
	expect(VBreadcrumb).toBeTruthy();

	const wrapper = mount(VBreadcrumb, {
		props: {
			items: [
				{
					to: 'hi',
					name: 'Hi',
				},
				{
					to: 'wow',
					name: 'Wow',
					icon: 'close',
				},
				{
					to: 'disabled',
					name: 'Disabled',
					disabled: true,
				},
			],
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});
