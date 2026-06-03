import type { Preset } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { usePreset } from './use-preset';
import { usePresetsStore } from '@/stores/presets';
import { useUserStore } from '@/stores/user';

vi.mock('@/api', () => ({
	default: {
		post: vi.fn(),
		patch: vi.fn(),
	},
}));

vi.mock('@/utils/translate-literal', () => ({
	translate: (val: string | null) => val,
}));

const mockUser = {
	id: 'user-1',
	role: { id: 'role-1' },
};

const bookmarkPreset: Preset = {
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
	color: '#FF0000',
};

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	const userStore = useUserStore();
	userStore.currentUser = mockUser as any;
});

describe('usePreset', () => {
	test('initializes localPreset with bookmark icon and color', () => {
		const presetsStore = usePresetsStore();
		presetsStore.collectionPresets = [bookmarkPreset];

		const collection = ref('articles');
		const bookmark = ref<number | null>(42);

		const { localPreset } = usePreset(collection, bookmark);

		expect(localPreset.value.icon).toBe('star');
		expect(localPreset.value.color).toBe('#FF0000');
	});

	test('syncs bookmark icon and color when store updates', () => {
		const presetsStore = usePresetsStore();
		presetsStore.collectionPresets = [bookmarkPreset];

		const collection = ref('articles');
		const bookmark = ref<number | null>(42);

		const { localPreset, bookmarkSaved } = usePreset(collection, bookmark);

		presetsStore.$patch({
			collectionPresets: [
				{
					...bookmarkPreset,
					icon: 'favorite',
					color: '#00FF00',
				},
			],
		});

		expect(localPreset.value.icon).toBe('favorite');
		expect(localPreset.value.color).toBe('#00FF00');
		expect(bookmarkSaved.value).toBe(true);
	});

	test('syncs bookmark title when store updates', () => {
		const presetsStore = usePresetsStore();
		presetsStore.collectionPresets = [bookmarkPreset];

		const collection = ref('articles');
		const bookmark = ref<number | null>(42);

		const { localPreset, bookmarkSaved } = usePreset(collection, bookmark);

		presetsStore.$patch({
			collectionPresets: [
				{
					...bookmarkPreset,
					bookmark: 'Renamed Bookmark',
				},
			],
		});

		expect(localPreset.value.bookmark).toBe('Renamed Bookmark');
		expect(bookmarkSaved.value).toBe(true);
	});

	test('does not sync when bookmark is removed from store', () => {
		const presetsStore = usePresetsStore();
		presetsStore.collectionPresets = [bookmarkPreset];

		const collection = ref('articles');
		const bookmark = ref<number | null>(42);

		const { localPreset } = usePreset(collection, bookmark);

		expect(localPreset.value.icon).toBe('star');

		presetsStore.$patch({ collectionPresets: [] });

		expect(localPreset.value.icon).toBe('star');
		expect(localPreset.value.color).toBe('#FF0000');
	});

	test('reinitializes localPreset when bookmark ref changes', async () => {
		const otherBookmark: Preset = {
			...bookmarkPreset,
			id: 99,
			bookmark: 'Other Bookmark',
			icon: 'folder',
			color: '#0000FF',
		};

		const presetsStore = usePresetsStore();
		presetsStore.collectionPresets = [bookmarkPreset, otherBookmark];

		const collection = ref('articles');
		const bookmark = ref<number | null>(42);

		const { localPreset } = usePreset(collection, bookmark);

		expect(localPreset.value.icon).toBe('star');

		bookmark.value = 99;
		await nextTick();

		expect(localPreset.value.icon).toBe('folder');
		expect(localPreset.value.color).toBe('#0000FF');
		expect(localPreset.value.bookmark).toBe('Other Bookmark');
	});
});
