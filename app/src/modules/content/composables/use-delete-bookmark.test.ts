import type { Preset } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeleteBookmark } from './use-delete-bookmark';
import { usePresetsStore } from '@/stores/presets';
import { unexpectedError } from '@/utils/unexpected-error';

const replaceMock = vi.fn();
const routeRef: { query: Record<string, any> } = { query: {} };

vi.mock('vue-router', () => ({
	useRoute: () => routeRef,
	useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

const bookmark: Preset = {
	id: 42,
	bookmark: 'My Bookmark',
	collection: 'articles',
	user: 'user-1',
	role: null,
	search: null,
	filter: null,
	layout: 'tabular',
	layout_query: null,
	layout_options: null,
	refresh_interval: null,
	icon: 'star',
	color: null,
};

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	replaceMock.mockReset();
	routeRef.query = {};
});

describe('useDeleteBookmark', () => {
	it('exposes initial state refs', () => {
		const { deleteActive, deleteSaving } = useDeleteBookmark();
		expect(deleteActive.value).toBe(false);
		expect(deleteSaving.value).toBe(false);
	});

	it('calls presetsStore.delete with the bookmark id and closes the dialog', async () => {
		const presetsStore = usePresetsStore();
		(presetsStore.delete as any).mockResolvedValue(undefined);

		const { deleteActive, deleteSaving, deleteSave } = useDeleteBookmark();
		deleteActive.value = true;

		await deleteSave(bookmark);

		expect(presetsStore.delete).toHaveBeenCalledWith([42]);
		expect(deleteActive.value).toBe(false);
		expect(deleteSaving.value).toBe(false);
	});

	it('navigates to collection route when the active route is on the deleted bookmark', async () => {
		const presetsStore = usePresetsStore();
		(presetsStore.delete as any).mockResolvedValue(undefined);
		routeRef.query = { bookmark: '42' };

		const { deleteSave } = useDeleteBookmark();
		await deleteSave(bookmark);

		expect(replaceMock).toHaveBeenCalledWith('/content/articles');
	});

	it('does not navigate when the active route is on a different bookmark', async () => {
		const presetsStore = usePresetsStore();
		(presetsStore.delete as any).mockResolvedValue(undefined);
		routeRef.query = { bookmark: '7' };

		const { deleteSave } = useDeleteBookmark();
		await deleteSave(bookmark);

		expect(replaceMock).not.toHaveBeenCalled();
	});

	it('does not navigate when no bookmark query is present', async () => {
		const presetsStore = usePresetsStore();
		(presetsStore.delete as any).mockResolvedValue(undefined);

		const { deleteSave } = useDeleteBookmark();
		await deleteSave(bookmark);

		expect(replaceMock).not.toHaveBeenCalled();
	});

	it('keeps the dialog open and clears saving on error', async () => {
		const presetsStore = usePresetsStore();
		const err = new Error('boom');
		(presetsStore.delete as any).mockRejectedValue(err);

		const { deleteActive, deleteSaving, deleteSave } = useDeleteBookmark();
		deleteActive.value = true;

		await deleteSave(bookmark);

		expect(unexpectedError).toHaveBeenCalledWith(err);
		expect(deleteActive.value).toBe(true);
		expect(deleteSaving.value).toBe(false);
	});

	it('is a no-op when bookmark has no id', async () => {
		const presetsStore = usePresetsStore();
		const { deleteSave } = useDeleteBookmark();
		await deleteSave({ ...bookmark, id: undefined });
		expect(presetsStore.delete).not.toHaveBeenCalled();
	});

	it('is a no-op while a save is already in flight', async () => {
		const presetsStore = usePresetsStore();
		(presetsStore.delete as any).mockResolvedValue(undefined);

		const { deleteSaving, deleteSave } = useDeleteBookmark();
		deleteSaving.value = true;

		await deleteSave(bookmark);
		expect(presetsStore.delete).not.toHaveBeenCalled();
	});
});
