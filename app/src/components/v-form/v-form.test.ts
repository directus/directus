import { test, expect, beforeEach, vitest, vi } from 'vitest';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { mount } from '@vue/test-utils';
import { nanoid } from 'nanoid';

// import { generateRouter } from '@/__utils__/router';
// import { nanoid } from 'nanoid/non-secure';
// import { Directive, h } from 'vue';
// import { Router } from 'vue-router';

import VForm from './v-form.vue';

let router: Router;
let global: GlobalMountOptions;

// mocking insecure version of nanoid
vi.mock('nanoid', () => {
	return {
		nanoid: vi.fn(() => 'test'),
	};
});

// beforeEach(async () => {
// 	router = generateRouter([
// 		{
// 			path: '/',
// 			component: h('div', VForm),
// 		},
// 		{
// 			path: '/test',
// 			component: h('div', 'empty'),
// 		},
// 	]);
// 	router.push('/');
// 	await router.isReady();

// 	global = {
// 		stubs: ['v-progress-circular'],
// 		directives: {},
// 		plugins: [router],
// 	};
// });

test('Mount component', () => {
	expect(nanoid()).toBe('test');
	expect(VForm).toBeTruthy();

	// const wrapper = mount(VForm, {
	// 	props: {
	// 		fields: [],
	// 	},
	// 	global,
	// });

	// console.log(wrapper.html());
	// expect('x').toBe('x');
	// expect(wrapper.html()).toMatchSnapshot();
});
