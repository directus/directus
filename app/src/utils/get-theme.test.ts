import { test, expect, beforeEach, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import { cryptoStub } from '@/__utils__/crypto';
vi.stubGlobal('crypto', cryptoStub);

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		})
	);
});

import { getTheme } from '@/utils/get-theme';
import { useUserStore } from '@/stores/user';

test(`Defaults to light when configured to auto and matchMedia isn't available in the browser`, () => {
	const userStore = useUserStore();

	userStore.currentUser = undefined as any;
	window.matchMedia = undefined as any;

	expect(getTheme()).toBe('light');

	userStore.currentUser = {} as any;

	expect(getTheme()).toBe('light');
});

test(`Uses matchMedia to find browser preference for dark mode`, () => {
	const userStore = useUserStore();

	userStore.currentUser = undefined as any;
	window.matchMedia = vi.fn(() => ({ matches: true })) as any;

	expect(getTheme()).toBe('dark');
});

test(`Returns configured theme if not set to auto in store`, () => {
	const userStore = useUserStore();

	userStore.currentUser = { theme: 'light' } as any;

	expect(getTheme()).toBe('light');

	userStore.currentUser = { theme: 'dark' } as any;

	expect(getTheme()).toBe('dark');
});
