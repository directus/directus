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

	test('Returns dir as rtl for RTL languages', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: null } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'ar-SA' } } as any);
		expect(getCurrentLanguage()).toEqual({ lang: 'ar-SA', dir: 'rtl' });
	});

	test('Returns dir as specified if user has language_direction set', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: 'en-US' } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'en-US', language_direction: 'rtl' } } as any);
		expect(getCurrentLanguage()).toEqual({ lang: 'en-US', dir: 'rtl' });
	});

	test('Returns dir as ltr for non-RTL languages when direction is auto', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: 'fr-FR' } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'fr-FR', language_direction: 'auto' } } as any);
		expect(getCurrentLanguage()).toEqual({ lang: 'fr-FR', dir: 'ltr' });
	});

	test('Returns dir as rtl for RTL language when direction is auto', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: 'ar-SA' } } } as any);
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'ar-SA', language_direction: 'auto' } } as any);
		expect(getCurrentLanguage()).toEqual({ lang: 'ar-SA', dir: 'rtl' });
	});

	test('Falls back to ltr if language_direction is invalid', () => {
		vi.mocked(useServerStore).mockReturnValue({ info: { project: { default_language: 'en-US' } } } as any);

		vi.mocked(useUserStore).mockReturnValue({
			currentUser: { language: 'en-US', language_direction: 'invalid' },
		} as any);

		expect(getCurrentLanguage()).toEqual({ lang: 'en-US', dir: 'ltr' });
	});
});
