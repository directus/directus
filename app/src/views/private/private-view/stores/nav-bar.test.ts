import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref, ref } from 'vue';
import { NAV_BAR_DEFAULT_SIZE, NAV_BAR_MIN_SIZE, useNavBarStore } from './nav-bar';

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
		useBreakpoints: () => ({
			lg: ref(true),
			xl: ref(true),
		}),
	};
});

vi.mock('vue-router', () => ({
	useRoute: () => ({
		fullPath: ref('/'),
	}),
}));

beforeEach(() => {
	storageRefs.clear();
	setActivePinia(createPinia());
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('nav-bar store size guard', () => {
	it('returns default size on init', () => {
		const store = useNavBarStore();
		expect(store.size).toBe(NAV_BAR_DEFAULT_SIZE);
	});

	it('accepts finite values', () => {
		const store = useNavBarStore();
		store.size = 300;
		expect(store.size).toBe(300);
	});

	it('rejects NaN and returns default', () => {
		const store = useNavBarStore();
		store.size = NaN;
		expect(store.size).toBe(NAV_BAR_DEFAULT_SIZE);
	});

	it('rejects Infinity and returns default', () => {
		const store = useNavBarStore();
		store.size = Infinity;
		expect(store.size).toBe(NAV_BAR_DEFAULT_SIZE);
	});

	it('rejects -Infinity and returns default', () => {
		const store = useNavBarStore();
		store.size = -Infinity;
		expect(store.size).toBe(NAV_BAR_DEFAULT_SIZE);
	});

	it('preserves last valid value after rejected write', () => {
		const store = useNavBarStore();
		store.size = 320;
		store.size = NaN;
		expect(store.size).toBe(320);
	});

	it('self-heals corrupted stored value back to default', () => {
		const store = useNavBarStore();
		const storedSize = storageRefs.get('nav-bar-size')!;

		storedSize.value = NaN;
		expect(store.size).toBe(NAV_BAR_DEFAULT_SIZE);
		expect(storedSize.value).toBe(NAV_BAR_DEFAULT_SIZE);
	});
});

describe('nav-bar store enforce-default on expand', () => {
	it('returns default size when expanding after stored size is below min', () => {
		const store = useNavBarStore();
		const storedSize = storageRefs.get('nav-bar-size')!;

		storedSize.value = 54; // collapsed-size written during drag-to-collapse
		store.collapse();
		store.expand();

		expect(store.size).toBe(NAV_BAR_DEFAULT_SIZE);
	});

	it('returns default size when expanding after stored size equals min', () => {
		const store = useNavBarStore();
		const storedSize = storageRefs.get('nav-bar-size')!;

		storedSize.value = NAV_BAR_MIN_SIZE;
		store.collapse();
		store.expand();

		expect(store.size).toBe(NAV_BAR_DEFAULT_SIZE);
	});

	it('preserves stored size when expanding if stored size is above min', () => {
		const store = useNavBarStore();
		const storedSize = storageRefs.get('nav-bar-size')!;

		storedSize.value = 280;
		store.collapse();
		store.expand();

		expect(store.size).toBe(280);
	});

	it('clears enforce-default once size is dragged above min after expand', () => {
		const store = useNavBarStore();
		const storedSize = storageRefs.get('nav-bar-size')!;

		storedSize.value = 54;
		store.collapse();
		store.expand();
		expect(store.size).toBe(NAV_BAR_DEFAULT_SIZE); // enforce-default active

		store.size = 250; // user drags above NAV_BAR_MIN_SIZE
		storedSize.value = 250;
		expect(store.size).toBe(250); // enforce-default cleared
	});

	it('does not enforce default on collapse', () => {
		const store = useNavBarStore();
		const storedSize = storageRefs.get('nav-bar-size')!;

		storedSize.value = 280;
		store.collapse();

		expect(store.size).toBe(280);
	});
});
