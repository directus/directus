import { test, expect, beforeEach, vitest, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import VButton from './v-button.vue';
import { Directive, h } from 'vue';
import { generateRouter } from '@/__utils__/router';
import { Router } from 'vue-router';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const Focus: Directive = {
	mounted(el, binding) {
		if (binding.value) {
			el.focus();
		} else {
			el.blur();
		}
	},
};

let router: Router;

let global: GlobalMountOptions;

beforeEach(async () => {
	router = generateRouter([
		{
			path: '/',
			component: h('div', VButton),
		},
		{
			path: '/test',
			component: h('div', 'empty'),
		},
	]);
	router.push('/');
	await router.isReady();

	global = {
		stubs: ['v-progress-circular'],
		directives: {
			focus: Focus,
		},
		plugins: [router],
	};
});

test('Mount component', () => {
	expect(VButton).toBeTruthy();

	const wrapper = mount(VButton, {
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

// test('Click on link', async () => {
// 	const wrapper = mount(VButton, {
//         props: {
//             to: '/test'
//         },
// 		global
// 	});

//     await wrapper.get('a').trigger('click')

//     expect(router.currentRoute.value.path).toBe('/test')

// });
