import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { describe, expect, test, vi } from 'vitest';
import { getCurrentLanguage } from './get-current-language';

vi.mock('@/stores/server');
vi.mock('@/stores/user');

describe('getCurrentLanguage', () => {
	test('Returns fallback language if no server default and no current user', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: null } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: null } as any);
		expect(getCurrentLanguage('test')).toEqual({ lang: 'test', dir: 'ltr' });
	});

	test('Returns server default language if no current user', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: 'test' } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: null } as any);
		expect(getCurrentLanguage()).toEqual({ lang: 'test', dir: 'ltr' });
	});

	test('Returns current user language if no server default', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: null } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'test' } } as any);
		expect(getCurrentLanguage()).toEqual({ lang: 'test', dir: 'ltr' });
	});

	test('Returns current user language if there is server default', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: 'server' } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'test' } } as any);
		expect(getCurrentLanguage()).toEqual({ lang: 'test', dir: 'ltr' });
	});
});
