import { expect, test } from 'vitest';
import { userName } from '@/utils/user-name';

test(`Returns unknown when user isn't passed`, () => {
	expect(userName()).toBe('Unknown User');
	expect(userName(undefined)).toBe('Unknown User');
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
	expect(userName({ id: '12345' })).toBe('Unknown User');
});
