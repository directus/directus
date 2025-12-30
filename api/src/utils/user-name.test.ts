import { userName } from './user-name.js';
import { expect, test } from 'vitest';

const unknownUser = 'Unknown User';

test('should return "Unknown User" when user is undefined', () => {
	expect(userName(undefined as any)).toBe(unknownUser);
});

test('should return "Test User" when user first name is "Test" and last name is "User"', () => {
	expect(userName({ first_name: 'Test', last_name: 'User' })).toBe('Test User');
});

test('should return "Test" when user first name is "Test" but does not have last name', () => {
	expect(userName({ first_name: 'Test' })).toBe('Test');
});

test('should return user email when user only has email without first name and last name', () => {
	expect(userName({ email: 'test@example.com' })).toBe('test@example.com');
});

test('should return "Unknown User" when user is empty', () => {
	expect(userName({})).toBe(unknownUser);
});
