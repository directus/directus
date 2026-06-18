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

const splitMenuGlobal = () => ({
	...global,
	mocks: {
		$t: (value: string) => value,
	},
	stubs: {
		...Object.fromEntries((global.stubs as string[]).map((s) => [s, true])),
		'v-menu': {
			template: '<div><slot name="activator" :toggle="() => {}" :active="false" /><slot /></div>',
		},
		'v-icon': true,
	},
});

test('disables split-menu button when button is disabled', () => {
	const wrapper = mount(VButton, {
		global: splitMenuGlobal(),
		slots: {
			'split-menu': '<div>Menu item</div>',
		},
		props: {
			disabled: true,
		},
	});

	const splitMenuButton = wrapper.find('.split-menu-button');
	expect(splitMenuButton.attributes('disabled')).toBeDefined();
});

test('split-menu button is enabled by default when split-menu slot is provided', () => {
	const wrapper = mount(VButton, {
		global: splitMenuGlobal(),
		slots: {
			'split-menu': '<div>Menu item</div>',
		},
	});

	const splitMenuButton = wrapper.find('.split-menu-button');
	expect(splitMenuButton.attributes('disabled')).toBeUndefined();
});
