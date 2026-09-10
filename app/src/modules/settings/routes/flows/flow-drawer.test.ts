import { FlowRaw } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlowDrawer from './flow-drawer.vue';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

vi.mock('@/api', () => ({
	default: {
		post: vi.fn(),
		patch: vi.fn(),
	},
}));

vi.mock('@/stores/flows', () => ({
	useFlowsStore: () => ({
		flows: [
			{
				id: 'flow-1',
				name: 'Test Flow 1',
				status: 'active',
				trigger: 'manual',
				options: {},
			} as unknown as FlowRaw,
		],
		hydrate: vi.fn(),
	}),
}));

vi.mock('@/stores/license', () => ({
	useLicenseStore: () => ({
		limits: { flows: { remaining: 1, hasRemaining: true } },
		hydrate: vi.fn(),
	}),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

let global: GlobalMountOptions;

beforeEach(() => {
	global = {
		stubs: {
			'v-drawer': true,
			'v-divider': true,
			'v-fancy-select': true,
			'v-form': true,
			'v-icon': true,
			'v-input': true,
			'v-select': true,
			'v-tab': true,
			'v-tab-item': true,
			'v-tabs': true,
			'v-tabs-items': true,
			'interface-input-translated-string': true,
			'interface-select-color': true,
			'interface-select-icon': true,
		},
		plugins: [i18n, createTestingPinia({ createSpy: vi.fn, stubActions: false })],
		directives: {
			tooltip: Tooltip,
		},
	};

	vi.spyOn(i18n.global, 't').mockImplementation((key: string | number) => String(key) as any);
});

describe('FlowDrawer - save', () => {
	test('creates the Flow in the current folder', async () => {
		const api = (await vi.importMock<{ default: { post: ReturnType<typeof vi.fn> } }>('@/api')).default;
		api.post.mockResolvedValue({ data: { data: { id: 'new-flow-id' } } });

		const wrapper = mount(FlowDrawer, { global, props: { active: true, folder: 'folder-a' } });

		await (wrapper.vm as any).save();

		expect(api.post).toHaveBeenCalledWith('/flows', expect.objectContaining({ folder: 'folder-a' }), expect.anything());
	});

	test('creates the Flow at the root when no folder is active', async () => {
		const api = (await vi.importMock<{ default: { post: ReturnType<typeof vi.fn> } }>('@/api')).default;
		api.post.mockResolvedValue({ data: { data: { id: 'new-flow-id' } } });

		const wrapper = mount(FlowDrawer, { global, props: { active: true } });

		await (wrapper.vm as any).save();

		expect(api.post).toHaveBeenCalledWith('/flows', expect.objectContaining({ folder: null }), expect.anything());
	});

	test('does not touch the folder when updating an existing Flow', async () => {
		const api = (await vi.importMock<{ default: { patch: ReturnType<typeof vi.fn> } }>('@/api')).default;
		api.patch.mockResolvedValue({ data: { data: { id: 'flow-1' } } });

		const wrapper = mount(FlowDrawer, { global, props: { active: true, primaryKey: 'flow-1', folder: 'folder-a' } });

		await (wrapper.vm as any).save();

		expect(api.patch).toHaveBeenCalledWith(
			'/flows/flow-1',
			expect.not.objectContaining({ folder: expect.anything() }),
			expect.anything(),
		);
	});
});
