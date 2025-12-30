import TableHeader from './table-header.vue';
import type { Header, Sort } from './types';
import { Focus } from '@/__utils__/focus';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { useUserStore } from '@/stores/user';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Router } from 'vue-router';

// Mock the useUserStore
vi.mock('@/stores/user', () => ({
	useUserStore: vi.fn(),
}));

let router: Router;
let global: GlobalMountOptions;
let mockUserStore: any;

const defaultProps = {
	headers: [
		{
			text: 'Name',
			value: 'name',
			description: null,
			align: 'left' as const,
			sortable: true,
			width: 200,
		},
		{
			text: 'Email',
			value: 'email',
			description: null,
			align: 'left' as const,
			sortable: true,
			width: 250,
		},
	] as Header[],
	sort: {
		by: null,
		desc: false,
	} as Sort,
	reordering: false,
	allowHeaderReorder: true,
};

beforeEach(async () => {
	const pinia = createPinia();
	setActivePinia(pinia);

	// Mock user store
	mockUserStore = {
		textDirection: 'ltr',
	};

	vi.mocked(useUserStore).mockReturnValue(mockUserStore);

	router = generateRouter();
	router.push('/');
	await router.isReady();

	global = {
		stubs: ['v-icon', 'v-checkbox', 'v-menu'],
		directives: {
			focus: Focus,
			tooltip: Tooltip,
		},
		plugins: [router, pinia, i18n],
	};
});

describe('TableHeader', () => {
	test('Mount component', () => {
		expect(TableHeader).toBeTruthy();

		const wrapper = mount(TableHeader, {
			props: defaultProps,
			global,
		});

		expect(wrapper.find('thead').exists()).toBe(true);
	});

	test('renders headers correctly', () => {
		const wrapper = mount(TableHeader, {
			props: defaultProps,
			global,
		});

		const headers = wrapper.findAll('th.cell');
		// Should have 2 headers + 1 spacer
		expect(headers).toHaveLength(3);

		// Check header text content
		expect(wrapper.text()).toContain('Name');
		expect(wrapper.text()).toContain('Email');
	});

	test('shows resize handles when showResize is true', () => {
		const wrapper = mount(TableHeader, {
			props: {
				...defaultProps,
				showResize: true,
			},
			global,
		});

		const resizeHandles = wrapper.findAll('.resize-handle');
		expect(resizeHandles).toHaveLength(2); // One for each header
	});
});
