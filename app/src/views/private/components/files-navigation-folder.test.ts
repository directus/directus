import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Router } from 'vue-router';
import NavigationFolder from './files-navigation-folder.vue';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		patch: vi.fn(),
	},
}));

vi.mock('@/composables/use-folders', () => ({
	useFolders: () => ({
		folders: [],
		nestedFolders: [],
		fetchFolders: vi.fn(),
		loading: false,
		openFolders: [],
	}),
}));

const folder = { id: 'folder-a', name: 'Folder A', parent: null };

let router: Router;
let global: GlobalMountOptions;

beforeEach(async () => {
	router = generateRouter([{ path: '/files', component: { template: '<div />' } }]);
	router.push('/files');
	await router.isReady();

	global = {
		stubs: {
			'v-menu': { template: '<div><slot /></div>' },
			'v-list': { template: '<div><slot /></div>' },
			'v-list-item': true,
			'v-list-group': true,
			'v-list-item-icon': true,
			'v-list-item-content': true,
			'v-text-overflow': true,
			'v-icon': true,
			'v-dialog': true,
			'v-card': true,
			'v-card-title': true,
			'v-card-text': true,
			'v-card-actions': true,
			'v-button': true,
			'v-input': true,
			'folder-picker': true,
			'delete-folder-dialog': true,
		},
		plugins: [router, i18n, createTestingPinia({ createSpy: vi.fn, stubActions: false })],
		directives: {
			tooltip: Tooltip,
			contextMenu: {},
		},
	};

	vi.spyOn(i18n.global, 't').mockImplementation((key: string | number) => String(key) as any);
});

function contextMenuItems(wrapper: ReturnType<typeof mount>) {
	// The folder's own list item renders first; the rest are the context menu entries
	return wrapper.findAll('v-list-item-stub').slice(1);
}

describe('NavigationFolder - context menu permissions', () => {
	test('disables rename and move but not delete when updates are not allowed', () => {
		const wrapper = mount(NavigationFolder, {
			global,
			props: { folder, showDownload: false, updateDisabled: true },
		});

		const [rename, move, remove] = contextMenuItems(wrapper);

		expect(contextMenuItems(wrapper)).toHaveLength(3);
		expect(rename!.attributes('disabled')).toBe('true');
		expect(move!.attributes('disabled')).toBe('true');
		expect(remove!.attributes('disabled')).toBe('false');
	});

	test('disables delete but not rename or move when deletes are not allowed', () => {
		const wrapper = mount(NavigationFolder, {
			global,
			props: { folder, showDownload: false, deleteDisabled: true },
		});

		const [rename, move, remove] = contextMenuItems(wrapper);

		expect(rename!.attributes('disabled')).toBe('false');
		expect(move!.attributes('disabled')).toBe('false');
		expect(remove!.attributes('disabled')).toBe('true');
	});
});
