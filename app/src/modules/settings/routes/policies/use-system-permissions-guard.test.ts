import { flushPromises } from '@vue/test-utils';
import { expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useSystemPermissionsGuard } from './use-system-permissions-guard';
import { unexpectedError } from '@/utils/unexpected-error';

vi.mock('@/utils/unexpected-error');

const change = { collection: 'directus_files', action: 'read' as const, unfilteredRead: true };

test('saves right away when there are no system permission changes', async () => {
	const saveFn = vi.fn().mockResolvedValue(undefined);
	const { guardSave, confirmSystemPermissions } = useSystemPermissionsGuard(() => [], ref(false));

	await guardSave(saveFn);

	expect(saveFn).toHaveBeenCalledOnce();
	expect(confirmSystemPermissions.value).toBe(false);
});

test('holds the save until it is confirmed', async () => {
	const saveFn = vi.fn().mockResolvedValue(undefined);

	const { guardSave, confirmSave, confirmSystemPermissions, changes } = useSystemPermissionsGuard(
		async () => [change],
		ref(false),
	);

	await guardSave(saveFn);

	expect(saveFn).not.toHaveBeenCalled();
	expect(confirmSystemPermissions.value).toBe(true);
	expect(changes.value).toEqual([change]);

	await confirmSave();

	expect(saveFn).toHaveBeenCalledOnce();
	expect(confirmSystemPermissions.value).toBe(false);
});

test('does not save when the changes cannot be resolved', async () => {
	const saveFn = vi.fn();
	const error = new Error('Request failed');

	const { guardSave, checking } = useSystemPermissionsGuard(() => Promise.reject(error), ref(false));

	await guardSave(saveFn);

	expect(saveFn).not.toHaveBeenCalled();
	expect(unexpectedError).toHaveBeenCalledWith(error);
	expect(checking.value).toBe(false);
});

test('ignores saves requested while the changes are being resolved', async () => {
	const saveFn = vi.fn().mockResolvedValue(undefined);

	let resolveChanges: (changes: never[]) => void = () => {};

	const { guardSave } = useSystemPermissionsGuard(
		() => new Promise((resolve) => (resolveChanges = resolve)),
		ref(false),
	);

	guardSave(saveFn);
	guardSave(saveFn);
	resolveChanges([]);
	await flushPromises();

	expect(saveFn).toHaveBeenCalledOnce();
});
