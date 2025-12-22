import api from '@/api';
import { ItemPermissions } from '@directus/types';
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fetchItemPermissions } from './fetch-item-permissions';

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
