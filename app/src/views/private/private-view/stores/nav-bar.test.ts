import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useNavBarStore } from './nav-bar';

vi.mock('@vueuse/core', async () => {
	const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core');

	return {
		...actual,
		useLocalStorage: (_key: string, defaultValue: unknown) => ref(defaultValue),
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
	setActivePinia(createPinia());
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('nav-bar store size guard', () => {
	it('returns default size on init', () => {
		const store = useNavBarStore();
		expect(store.size).toBe(250);
	});

	it('accepts finite values', () => {
		const store = useNavBarStore();
		store.size = 300;
		expect(store.size).toBe(300);
	});

	it('rejects NaN and returns default', () => {
		const store = useNavBarStore();
		store.size = NaN;
		expect(store.size).toBe(250);
	});

	it('rejects Infinity and returns default', () => {
		const store = useNavBarStore();
		store.size = Infinity;
		expect(store.size).toBe(250);
	});

	it('rejects -Infinity and returns default', () => {
		const store = useNavBarStore();
		store.size = -Infinity;
		expect(store.size).toBe(250);
	});

	it('preserves last valid value after rejected write', () => {
		const store = useNavBarStore();
		store.size = 320;
		store.size = NaN;
		expect(store.size).toBe(320);
	});
});
