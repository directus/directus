import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { Router } from 'vue-router';
import type { Header } from './types';
import VTable from './v-table.vue';
import { Focus } from '@/__utils__/focus';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { useUserStore } from '@/stores/user';

vi.mock('@/stores/user', () => ({
	useUserStore: vi.fn(),
}));

let router: Router;
let global: GlobalMountOptions;
let mockUserStore: any;

const headers: Header[] = [
	{
		text: 'Name',
		value: 'name',
		description: null,
		align: 'left',
		sortable: true,
		width: 200,
	},
];

const items = [
	{ id: 1, name: 'Item 1' },
	{ id: 2, name: 'Item 2' },
];

beforeEach(async () => {
	const pinia = createPinia();
	setActivePinia(pinia);

	mockUserStore = {
		textDirection: 'ltr',
	};

	vi.mocked(useUserStore).mockReturnValue(mockUserStore);

	router = generateRouter();
	router.push('/');
	await router.isReady();

	global = {
		stubs: ['v-icon', 'v-checkbox', 'v-menu', 'v-progress-linear'],
		directives: {
			focus: Focus,
			tooltip: Tooltip,
		},
		plugins: [router, pinia, i18n],
	};
});

describe('VTable', () => {
	test('renders table rows', () => {
		const wrapper = mount(VTable, {
			props: {
				headers,
				items,
				itemKey: 'id',
			},
			global,
		});

		expect(wrapper.find('table').exists()).toBe(true);
		expect(wrapper.findAll('tbody tr')).toHaveLength(2);
	});

	test('reactively updates item-append slot when conditionally toggled by parent', async () => {
		const ParentComponent = defineComponent({
			components: { VTable },
			setup() {
				const showAppend = ref(false);
				return { showAppend, headers, items };
			},
			template: `
				<VTable :headers="headers" :items="items" item-key="id">
					<template v-if="showAppend" #item-append="{ item }">
						<button class="delete-btn">Delete {{ item.name }}</button>
					</template>
				</VTable>
			`,
		});

		const wrapper = mount(ParentComponent, { global });

		// Initially, append slot is not rendered
		expect(wrapper.findAll('.delete-btn')).toHaveLength(0);

		// Dynamically toggle append slot (simulating permissions hydration)
		wrapper.vm.showAppend = true;
		await wrapper.vm.$nextTick();

		// Append slot should now be reactively rendered
		const buttons = wrapper.findAll('.delete-btn');
		expect(buttons).toHaveLength(2);
		expect(buttons[0]?.text()).toBe('Delete Item 1');
		expect(buttons[1]?.text()).toBe('Delete Item 2');
	});
});
