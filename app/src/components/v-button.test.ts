import { mount } from '@vue/test-utils';
import { beforeEach, expect, test } from 'vitest';
import { Router } from 'vue-router';
import VButton from './v-button.vue';
import { Focus } from '@/__utils__/focus';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';

let router: Router;
let global: GlobalMountOptions;

beforeEach(async () => {
	router = generateRouter();

	router.push('/');
	await router.isReady();

	global = {
		stubs: ['v-progress-circular'],
		directives: {
			focus: Focus,
			tooltip: Tooltip,
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
