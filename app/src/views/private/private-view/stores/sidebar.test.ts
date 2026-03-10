import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref, ref } from 'vue';
import { useSidebarStore } from './sidebar';

const storageRefs = new Map<string, Ref>();

vi.mock('@vueuse/core', async () => {
	const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core');

	return {
		...actual,
		useLocalStorage: (key: string, defaultValue: unknown) => {
			const r = ref(defaultValue);
			storageRefs.set(key, r);
			return r;
		},
	};
});

beforeEach(() => {
	storageRefs.clear();
	setActivePinia(createPinia());
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('sidebar store size guard', () => {
	it('returns default size on init', () => {
		const store = useSidebarStore();
		expect(store.size).toBe(370);
	});

	it('accepts finite values', () => {
		const store = useSidebarStore();
		store.size = 400;
		expect(store.size).toBe(400);
	});

	it('rejects NaN and returns default', () => {
		const store = useSidebarStore();
		store.size = NaN;
		expect(store.size).toBe(370);
	});

	it('rejects Infinity and returns default', () => {
		const store = useSidebarStore();
		store.size = Infinity;
		expect(store.size).toBe(370);
	});

	it('rejects -Infinity and returns default', () => {
		const store = useSidebarStore();
		store.size = -Infinity;
		expect(store.size).toBe(370);
	});

	it('preserves last valid value after rejected write', () => {
		const store = useSidebarStore();
		store.size = 500;
		store.size = NaN;
		expect(store.size).toBe(500);
	});

	it('self-heals corrupted stored value back to default', () => {
		const store = useSidebarStore();
		const storedSize = storageRefs.get('sidebar-size')!;

		storedSize.value = NaN;
		expect(store.size).toBe(370);
		expect(storedSize.value).toBe(370);
	});
});
