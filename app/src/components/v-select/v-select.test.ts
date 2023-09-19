import { Focus } from '@/__utils__/focus';
import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import VList from '../v-list.vue';
import VSelect from './v-select.vue';

const i18n = createI18n({
	legacy: false,
	messages: {
		'en-US': {
			search: 'search',
		},
	},
});

const VMenu = {
	template: `
	<div id="v-menu-stub">
		<slot name="activator" />
		<slot
			v-bind="{
				active: true,
			}"
		/>
	</div>
	`,
};

const VInput = {
	template: `<div id="v-input-stub" />`,
	setup(_props: any, { emit }: any) {
		emit('update:modelValue', 'Item 1');
	},
};

const VListItem = {
	template: `
	<div id="v-list-item-stub">
		<slot />
	</div>
	`,
};

const VListItemContent = {
	template: `
	<div id="v-list-item-content-stub">
		<slot />
	</div>
	`,
};

const global = {
	stubs: {
		'v-menu': VMenu,
		'v-input': true,
		'v-list': VList,
		'v-list-item': VListItem,
		'v-list-item-content': VListItemContent,
		'v-list-item-icon': true,
		'v-divider': true,
		'v-checkbox': true,
		'v-icon': true,
	},
	plugins: [i18n],
	directives: {
		Focus,
	},
};

test('should render with object items', () => {
	const items = Array.from({ length: 3 }, (_, index) => {
		const number = index + 1;
		return { text: `Item ${number}`, value: `item${number}` };
	});

	expect(VSelect).toBeTruthy();

	const wrapper = mount(VSelect, {
		props: {
			items,
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('should render with string items', () => {
	const items = Array.from({ length: 3 }, (_, index) => `Item ${index + 1}`);

	expect(VSelect).toBeTruthy();

	const wrapper = mount(VSelect, {
		props: {
			items,
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

describe('should hide items not matching search value', () => {
	// There have to be >10 items to enable search

	const objectItems = Array.from({ length: 11 }, (_, index) => {
		const number = index + 1;
		return { text: `Item ${number}`, value: `item${number}` };
	});

	const stringItems = Array.from({ length: 11 }, (_, index) => `Item ${index + 1}`);

	test.each([
		['object items', objectItems],
		['string items', stringItems],
	])('%s', async (_, items) => {
		expect(VSelect).toBeTruthy();

		const wrapper = mount(VSelect, {
			props: {
				items,
			},
			global: { ...global, stubs: { ...global.stubs, 'v-input': VInput } },
		});

		// Wait for search debounce
		await new Promise((r) => setTimeout(r, 300));

		expect(wrapper.html()).toMatchSnapshot();
	});
});
