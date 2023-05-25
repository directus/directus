import { test, expect, describe, vi } from 'vitest';
import { getCurrentLanguage } from './get-current-language';
import { useUserStore } from '@/stores/user';

vi.mock('@/stores/user');

describe('getCurrentLanguage', () => {
	test('Returns fallback', () => {
		vi.mocked(useUserStore).mockReturnValue({ currentUser: null } as any);
		expect(getCurrentLanguage('test')).toBe('test');
	});

	test('Returns language from store', () => {
		vi.mocked(useUserStore).mockReturnValue({ currentUser: { language: 'test' } } as any);
		expect(getCurrentLanguage()).toBe('test');
	});
});
