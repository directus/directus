import { describe, expect, it } from 'vitest';
import { userName } from './user-name.js';

describe('userName', () => {
	it('returns full name when first_name and last_name are provided', () => {
		expect(userName({ first_name: 'John', last_name: 'Doe' })).toBe('John Doe');
	});

	it('returns first_name when only first_name is provided', () => {
		expect(userName({ first_name: 'John' })).toBe('John');
	});

	it('returns email when only email is provided', () => {
		expect(userName({ email: 'john@example.com' })).toBe('john@example.com');
	});

	it('returns "Unknown User" when no identifying info is provided', () => {
		expect(userName({})).toBe('Unknown User');
	});

	it('returns "Unknown User" for null-ish user', () => {
		expect(userName(null as any)).toBe('Unknown User');
	});

	it('returns "Unknown User" for undefined user', () => {
		expect(userName(undefined as any)).toBe('Unknown User');
	});

	it('prefers full name over email', () => {
		expect(
			userName({
				first_name: 'John',
				last_name: 'Doe',
				email: 'john@example.com',
			}),
		).toBe('John Doe');
	});

	it('prefers first_name over email when last_name is missing', () => {
		expect(
			userName({
				first_name: 'John',
				email: 'john@example.com',
			}),
		).toBe('John');
	});

	it('returns email when first_name is empty string', () => {
		expect(
			userName({
				first_name: '',
				email: 'john@example.com',
			}),
		).toBe('john@example.com');
	});

	it('returns first_name only when last_name is empty string', () => {
		expect(
			userName({
				first_name: 'John',
				last_name: '',
			}),
		).toBe('John');
	});

	it('handles user with only last_name', () => {
		expect(userName({ last_name: 'Doe' })).toBe('Unknown User');
	});

	it('handles whitespace in names', () => {
		expect(userName({ first_name: '  John  ', last_name: '  Doe  ' })).toBe('  John     Doe  ');
	});

	it('returns "Unknown User" when email is empty string', () => {
		expect(userName({ email: '' })).toBe('Unknown User');
	});
});
