import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { ref } from 'vue';
import { usePanelPermissions } from './use-panel-permissions';
import { mockedStore } from '@/__utils__/store';
import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import type { ActionPermission } from '@/types/permissions';
import { unexpectedError } from '@/utils/unexpected-error';

vi.mock('@/utils/unexpected-error', () => ({ unexpectedError: vi.fn() }));

type Access = ActionPermission['access'];

let apiSpy: MockInstance<typeof api.get>;

function setup({
	isAdmin = false,
	create = 'full',
	update = 'partial',
	delete: remove = 'partial',
}: { isAdmin?: boolean; create?: Access; update?: Access; delete?: Access } = {}) {
	const userStore = mockedStore(useUserStore());
	userStore.isAdmin = isAdmin;

	const permissionsStore = mockedStore(usePermissionsStore());

	permissionsStore.hasPermission.mockImplementation((_collection, action) => {
		return isAdmin || (action === 'create' ? create : 'none') !== 'none';
	});

	permissionsStore.getPermission.mockImplementation((_collection, action) => {
		const access: Access = ({ update, delete: remove } as Record<string, Access>)[action] ?? 'none';
		return { access } as any;
	});
}

function itemPermissions(update: boolean, remove: boolean) {
	return { data: { data: { update: { access: update }, delete: { access: remove }, share: { access: false } } } };
}

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn }));

	apiSpy = vi.spyOn(api, 'get');
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('collection level decides', () => {
	it.each<{ name: string; options: Parameters<typeof setup>[0]; expected: boolean }>([
		{ name: 'admin', options: { isAdmin: true }, expected: true },
		{ name: 'full access', options: { update: 'full', delete: 'full' }, expected: true },
		{ name: 'no access', options: { update: 'none', delete: 'none' }, expected: false },
	])('should not request item permissions for $name', async ({ options, expected }) => {
		setup(options);

		const permissions = usePanelPermissions(['1', '2'], true);
		await flushPromises();

		expect(apiSpy).not.toHaveBeenCalled();
		expect(permissions.value['1']).toEqual({ update: expected, delete: expected });
		expect(permissions.value['2']).toEqual({ update: expected, delete: expected });
	});
});

describe('item level checks', () => {
	it('should not request anything outside of edit mode and keep persisted panels locked', async () => {
		setup();

		const permissions = usePanelPermissions(['1'], false);
		await flushPromises();

		expect(apiSpy).not.toHaveBeenCalled();
		expect(permissions.value['1']).toEqual({ update: false, delete: false });
	});

	it('should request persisted panels once in edit mode and skip staged ones', async () => {
		setup();

		apiSpy.mockImplementation(async (url) => {
			return url.endsWith('/1') ? itemPermissions(true, false) : itemPermissions(false, true);
		});

		const permissions = usePanelPermissions(['1', '2', '_staged'], true);
		await flushPromises();

		expect(apiSpy).toHaveBeenCalledTimes(2);
		expect(apiSpy).toHaveBeenCalledWith('/permissions/me/directus_panels/1');
		expect(apiSpy).toHaveBeenCalledWith('/permissions/me/directus_panels/2');

		expect(permissions.value['1']).toEqual({ update: true, delete: false });
		expect(permissions.value['2']).toEqual({ update: false, delete: true });
		expect(permissions.value['_staged']).toEqual({ update: true, delete: true });
	});

	it('should allow editing staged panels only when they can be created', async () => {
		setup({ create: 'none' });

		const permissions = usePanelPermissions(['_staged'], true);
		await flushPromises();

		expect(permissions.value['_staged']).toEqual({ update: false, delete: true });
	});

	it('should only use item permissions for actions with conditional collection permissions', async () => {
		setup({ update: 'partial', delete: 'full' });

		apiSpy.mockResolvedValue(itemPermissions(false, false));

		const permissions = usePanelPermissions(['1'], true);
		await flushPromises();

		expect(permissions.value['1']).toEqual({ update: false, delete: true });
	});

	it('should not refetch when only staged panels change', async () => {
		setup();

		apiSpy.mockResolvedValue(itemPermissions(true, true));

		const panelIds = ref(['1']);
		usePanelPermissions(panelIds, true);
		await flushPromises();

		panelIds.value = ['1', '_staged'];
		await flushPromises();

		expect(apiSpy).toHaveBeenCalledTimes(1);
	});

	it('should drop fetched permissions when leaving edit mode and fetch again on re-entry', async () => {
		setup();

		apiSpy.mockResolvedValue(itemPermissions(true, true));

		const enabled = ref(true);
		const permissions = usePanelPermissions(['1'], enabled);
		await flushPromises();

		expect(permissions.value['1']).toEqual({ update: true, delete: true });

		enabled.value = false;
		await flushPromises();

		expect(permissions.value['1']).toEqual({ update: false, delete: false });

		enabled.value = true;
		await flushPromises();

		expect(apiSpy).toHaveBeenCalledTimes(2);
		expect(permissions.value['1']).toEqual({ update: true, delete: true });
	});

	it('should ignore responses that arrive after edit mode was left', async () => {
		setup();

		let resolve!: (value: unknown) => void;
		apiSpy.mockReturnValue(new Promise((r) => (resolve = r)) as any);

		const enabled = ref(true);
		const permissions = usePanelPermissions(['1'], enabled);
		await flushPromises();

		enabled.value = false;
		await flushPromises();

		resolve(itemPermissions(true, true));
		await flushPromises();

		expect(permissions.value['1']).toEqual({ update: false, delete: false });
	});

	it('should fall back to allowed and report a single error when requests fail', async () => {
		setup();

		apiSpy.mockRejectedValue(new Error('failed'));

		const permissions = usePanelPermissions(['1', '2'], true);
		await flushPromises();

		expect(permissions.value['1']).toEqual({ update: true, delete: true });
		expect(permissions.value['2']).toEqual({ update: true, delete: true });
		expect(unexpectedError).toHaveBeenCalledTimes(1);
	});
});
