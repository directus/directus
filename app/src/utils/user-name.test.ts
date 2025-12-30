import { userName } from '@/utils/user-name';
import { expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

vi.mock('@/lang', () => {
	return {
		i18n: createI18n({
			legacy: false,
			locale: 'en-US',
			messages: {
				'en-US': {
					unknown_user: 'TEST_UNKNOWN',
				},
			},
		}),
	};
});

test(`Returns unknown when user isn't passed`, () => {
	expect(userName()).toBe('TEST_UNKNOWN');
	expect(userName(undefined)).toBe('TEST_UNKNOWN');
});

test(`Returns first + last name if both exist`, () => {
	expect(userName({ first_name: 'Test', last_name: 'Last' })).toBe('Test Last');
});

test(`Returns just first name if last name doesn't exist`, () => {
	expect(userName({ first_name: 'Test' })).toBe('Test');
});

test(`Returns email address if first name doesn't exist`, () => {
	expect(userName({ email: 'test@example.com' })).toBe('test@example.com');
});

test(`Returns unknown if name and email are missing`, () => {
	expect(userName({ id: '12345' })).toBe('TEST_UNKNOWN');
});
