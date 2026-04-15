import { ItemPermissions } from '@directus/types';
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { fetchItemPermissions } from './fetch-item-permissions';
import api from '@/api';

let sample: {
	collection: string;
	primaryKey: string;
	itemPermissions: ItemPermissions;
};

beforeEach(() => {
	sample = {
		collection: 'test_collection',
		primaryKey: 'test-primary-key',
		itemPermissions: {
			update: {
				access: true,
			},
			delete: {
				access: false,
			},
			share: {
				access: true,
			},
		},
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

it('should lazy fetch item permissions', async () => {
	const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: sample.itemPermissions } });

	fetchItemPermissions(sample.collection, sample.primaryKey);

	await flushPromises();

	expect(apiSpy).toHaveBeenCalledTimes(0);
});

it('should fetch item permissions only once for same item', async () => {
	const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: sample.itemPermissions } });

	const { fetchedItemPermissions } = fetchItemPermissions(sample.collection, sample.primaryKey);

	// initial render
	expect(fetchedItemPermissions.value.update.access).toBe(false);
	expect(fetchedItemPermissions.value.delete.access).toBe(false);
	expect(fetchedItemPermissions.value.share.access).toBe(false);

	await flushPromises();

	expect(fetchedItemPermissions.value.update.access).toBe(sample.itemPermissions.update.access);
	expect(fetchedItemPermissions.value.delete.access).toBe(sample.itemPermissions.delete.access);
	expect(fetchedItemPermissions.value.share.access).toBe(sample.itemPermissions.share.access);

	expect(apiSpy).toHaveBeenCalledTimes(1);
});

it('should fetch collection item permissions if primary key is defined', async () => {
	const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: sample.itemPermissions } });

	const { fetchedItemPermissions } = fetchItemPermissions(sample.collection, sample.primaryKey);

	// initial render
	expect(fetchedItemPermissions.value.update.access).toBe(false);

	await flushPromises();

	expect(apiSpy).toHaveBeenCalledWith(`/permissions/me/${sample.collection}/${sample.primaryKey}`);
});

it('should fetch singleton item permissions if primary key is undefined', async () => {
	const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: sample.itemPermissions } });

	const primaryKey = null;

	const { fetchedItemPermissions } = fetchItemPermissions(sample.collection, primaryKey);

	// initial render
	expect(fetchedItemPermissions.value.update.access).toBe(false);

	await flushPromises();

	expect(apiSpy).toHaveBeenCalledWith(`/permissions/me/${sample.collection}`);
});

it('should not fetch item permissions if primary key is undefined', async () => {
	const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: sample.itemPermissions } });

	const { fetchedItemPermissions } = fetchItemPermissions(sample.collection, undefined);

	// Trigger access to start evaluation
	expect(fetchedItemPermissions.value.update.access).toBe(false);

	await flushPromises();

	expect(apiSpy).not.toHaveBeenCalled();

	// Should remain at default permissions
	expect(fetchedItemPermissions.value.update.access).toBe(false);
	expect(fetchedItemPermissions.value.delete.access).toBe(false);
	expect(fetchedItemPermissions.value.share.access).toBe(false);
});

it('should retain last fetched permissions when primary key becomes undefined', async () => {
	vi.spyOn(api, 'get').mockResolvedValue({ data: { data: sample.itemPermissions } });

	const primaryKey = ref<string | undefined>(sample.primaryKey);
	const { fetchedItemPermissions } = fetchItemPermissions(sample.collection, primaryKey);

	expect(fetchedItemPermissions.value.update.access).toBe(false);

	await flushPromises();

	expect(fetchedItemPermissions.value.update.access).toBe(sample.itemPermissions.update.access);

	// Change primary key to undefined (e.g. navigating away before item is saved)
	primaryKey.value = undefined;

	await flushPromises();

	// Should retain last fetched permissions rather than resetting to defaults
	expect(fetchedItemPermissions.value.update.access).toBe(sample.itemPermissions.update.access);
	expect(fetchedItemPermissions.value.delete.access).toBe(sample.itemPermissions.delete.access);
	expect(fetchedItemPermissions.value.share.access).toBe(sample.itemPermissions.share.access);
});

it('should discard stale response when a newer request completes first', async () => {
	const stalePermissions: ItemPermissions = {
		update: { access: true },
		delete: { access: true },
		share: { access: true },
	};

	const freshPermissions: ItemPermissions = {
		update: { access: true },
		delete: { access: false },
		share: { access: true },
	};

	let resolveStale!: (value: any) => void;
	let resolveFresh!: (value: any) => void;

	const stalePromise = new Promise((resolve) => {
		resolveStale = resolve;
	});

	const freshPromise = new Promise((resolve) => {
		resolveFresh = resolve;
	});

	vi.spyOn(api, 'get')
		.mockReturnValueOnce(stalePromise as any)
		.mockReturnValueOnce(freshPromise as any);

	const { refresh, fetchedItemPermissions } = fetchItemPermissions(sample.collection, sample.primaryKey);

	// Trigger initial access to start first (stale) request
	expect(fetchedItemPermissions.value.update.access).toBe(false);

	await nextTick();

	// Trigger refresh to start second (fresh) request before stale resolves
	refresh();

	await nextTick();

	// Resolve fresh (second) request first
	resolveFresh({ data: { data: freshPermissions } });

	await flushPromises();

	expect(fetchedItemPermissions.value.update.access).toBe(freshPermissions.update.access);

	// Now resolve the stale (first) request
	resolveStale({ data: { data: stalePermissions } });

	await flushPromises();

	// Stale response should have been discarded — fresh values must remain
	expect(fetchedItemPermissions.value.update.access).toBe(freshPermissions.update.access);
	expect(fetchedItemPermissions.value.delete.access).toBe(freshPermissions.delete.access);
	expect(fetchedItemPermissions.value.share.access).toBe(freshPermissions.share.access);
});

it('should fetch item permissions again on refresh call', async () => {
	const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: sample.itemPermissions } });

	const { refresh, fetchedItemPermissions } = fetchItemPermissions(sample.collection, sample.primaryKey);

	// initial render
	expect(fetchedItemPermissions.value.update.access).toBe(false);

	await flushPromises();

	refresh();

	await flushPromises();

	expect(apiSpy).toHaveBeenCalledTimes(2);
});
