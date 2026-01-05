import { cryptoStub } from '@/__utils__/crypto';
import { useUserStore } from '@/stores/user';
import { getAppearance } from '@/utils/get-appearance';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';

vi.stubGlobal('crypto', cryptoStub);

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

test(`Defaults to light when configured to auto and matchMedia isn't available in the browser`, () => {
	const userStore = useUserStore();

	userStore.currentUser = undefined as any;
	window.matchMedia = undefined as any;

	expect(getAppearance()).toBe('light');

	userStore.currentUser = {} as any;

	expect(getAppearance()).toBe('light');
});

test(`Uses matchMedia to find browser preference for dark mode`, () => {
	const userStore = useUserStore();

	userStore.currentUser = undefined as any;
	window.matchMedia = vi.fn(() => ({ matches: true })) as any;

	expect(getAppearance()).toBe('dark');
});

test(`Returns configured appearance if not set to auto in store`, () => {
	const userStore = useUserStore();

	userStore.currentUser = { appearance: 'light' } as any;

	expect(getAppearance()).toBe('light');

	userStore.currentUser = { appearance: 'dark' } as any;

	expect(getAppearance()).toBe('dark');
});
