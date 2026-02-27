import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import DrawerFiles from './drawer-files.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { useUserStore } from '@/stores/user';

const sessionStore = new Map<string, ReturnType<typeof ref>>();

vi.mock('@vueuse/core', () => ({
	useSessionStorage: vi.fn((key: string, initialValue: unknown) => {
		if (!sessionStore.has(key)) {
			sessionStore.set(key, ref(initialValue));
		}

		return sessionStore.get(key);
	}),
}));

vi.mock('@/stores/user', () => ({
	useUserStore: vi.fn(),
}));

vi.mock('@/utils/get-folder-filter', () => ({
	getFolderFilter: vi.fn(() => null),
}));

const FilesNavigationStub = defineComponent({
	name: 'FilesNavigation',
	props: {
		customTargetHandler: { type: Function, default: undefined },
		currentFolder: { type: String, default: undefined },
		currentSpecial: { type: String, default: undefined },
		rootFolder: { type: String, default: undefined },
		localOpenFolders: { type: Boolean, default: false },
		actionsDisabled: { type: Boolean, default: false },
	},
	template: '<div class="files-nav-stub"></div>',
});

let global: GlobalMountOptions;
let mockUserStore: any;

beforeEach(() => {
	sessionStore.clear();

	const pinia = createPinia();
	setActivePinia(pinia);

	mockUserStore = {
		currentUser: { id: 'test-user' },
	};

	vi.mocked(useUserStore).mockReturnValue(mockUserStore);

	global = {
		stubs: {
			DrawerCollection: {
				template: '<div><slot name="sidebar" /></div>',
			},
			FilesNavigation: FilesNavigationStub,
		},
		plugins: [pinia, i18n],
	};
});

describe('DrawerFiles', () => {
	test('persists folder state across unmount/remount cycles', async () => {
		const wrapper = mount(DrawerFiles, {
			props: {},
			global,
		});

		await flushPromises();

		const nav = wrapper.findComponent(FilesNavigationStub);
		expect(nav.props('currentFolder')).toBeUndefined();

		// Simulate folder navigation via the custom target handler
		const handler = nav.props('customTargetHandler') as (target: { folder?: string }) => void;
		handler({ folder: 'subfolder-123' });
		await flushPromises();

		expect(nav.props('currentFolder')).toBe('subfolder-123');

		wrapper.unmount();

		// Remount — folder state should be preserved from the previous mount
		const wrapper2 = mount(DrawerFiles, {
			props: {},
			global,
		});

		await flushPromises();

		const nav2 = wrapper2.findComponent(FilesNavigationStub);
		expect(nav2.props('currentFolder')).toBe('subfolder-123');

		wrapper2.unmount();
	});

	test('persists special folder state across unmount/remount cycles', async () => {
		// Use a unique folder key to isolate from other tests
		const wrapper = mount(DrawerFiles, {
			props: { folder: 'test-special' },
			global,
		});

		await flushPromises();

		const nav = wrapper.findComponent(FilesNavigationStub);
		const handler = nav.props('customTargetHandler') as (target: { special?: string }) => void;
		handler({ special: 'mine' });
		await flushPromises();

		expect(nav.props('currentSpecial')).toBe('mine');

		wrapper.unmount();

		const wrapper2 = mount(DrawerFiles, {
			props: { folder: 'test-special' },
			global,
		});

		await flushPromises();

		const nav2 = wrapper2.findComponent(FilesNavigationStub);
		expect(nav2.props('currentSpecial')).toBe('mine');

		wrapper2.unmount();
	});

	test('isolates persisted state between different root folder props', async () => {
		// Mount with folder A and navigate to subfolder
		const wrapperA = mount(DrawerFiles, {
			props: { folder: 'root-a' },
			global,
		});

		await flushPromises();

		const navA = wrapperA.findComponent(FilesNavigationStub);
		const handlerA = navA.props('customTargetHandler') as (target: { folder?: string }) => void;
		handlerA({ folder: 'subfolder-in-a' });
		await flushPromises();

		wrapperA.unmount();

		// Mount with folder B and navigate to a different subfolder
		const wrapperB = mount(DrawerFiles, {
			props: { folder: 'root-b' },
			global,
		});

		await flushPromises();

		const navB = wrapperB.findComponent(FilesNavigationStub);

		// Should NOT see folder A's state
		expect(navB.props('currentFolder')).toBe('root-b');

		const handlerB = navB.props('customTargetHandler') as (target: { folder?: string }) => void;
		handlerB({ folder: 'subfolder-in-b' });
		await flushPromises();

		wrapperB.unmount();

		// Remount folder A — should see its own persisted state
		const wrapperA2 = mount(DrawerFiles, {
			props: { folder: 'root-a' },
			global,
		});

		await flushPromises();

		const navA2 = wrapperA2.findComponent(FilesNavigationStub);
		expect(navA2.props('currentFolder')).toBe('subfolder-in-a');

		wrapperA2.unmount();
	});
});
