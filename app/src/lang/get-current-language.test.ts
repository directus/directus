import { test, expect, describe, vi } from 'vitest';
import { getCurrentLanguage } from './get-current-language';
import { useUserStore } from '@/stores/user';
import { useServerStore } from '@/stores/server';

vi.mock('@/stores/server');
vi.mock('@/stores/user');

describe('getCurrentLanguage', () => {
	test('Returns fallback language if no server default and no current user', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: null } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: null } as any);
		expect(getCurrentLanguage('test')).toBe('test');
	});

	test('Returns server default language if no current user', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: 'test' } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: null } as any);
		expect(getCurrentLanguage()).toBe('test');
	});

	test('Returns current user language if no server default', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: null } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'test' } } as any);
		expect(getCurrentLanguage()).toBe('test');
	});

	test('Returns current user language if there is server default', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: 'server' } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'test' } } as any);
		expect(getCurrentLanguage()).toBe('test');
	});
});
