import { beforeEach, describe, expect, test } from 'vitest';
import { NameDeduper } from './name-deduper.js';

describe('NameDeduper', () => {
	let deduper: NameDeduper;

	beforeEach(() => {
		deduper = new NameDeduper();
	});

	describe('incrementation', () => {
		test('should return original name when added for the first time', () => {
			expect(deduper.add('abc')).toEqual('abc');
		});

		test('should deduplicate names by appending occurence count (occurence) on subsequent matches', () => {
			expect(deduper.add('abc')).toEqual('abc');
			expect(deduper.add('abc')).toEqual('abc (1)');
		});

		test('should handle names with spaces', () => {
			expect(deduper.add('abc def')).toEqual('abc def');
			expect(deduper.add('abc def')).toEqual('abc def (1)');
		});

		test('should handle names with special characters', () => {
			expect(deduper.add('ab-cd_ef')).toEqual('ab-cd_ef');
			expect(deduper.add('ab-cd_ef')).toEqual('ab-cd_ef (1)');
		});

		test('should incrememnt count by number of deduplicated occurences', () => {
			expect(deduper.add('abc')).toEqual('abc');
			expect(deduper.add('abc')).toEqual('abc (1)');
			expect(deduper.add('abc')).toEqual('abc (2)');
			expect(deduper.add('abc')).toEqual('abc (3)');
			expect(deduper.add('abc')).toEqual('abc (4)');
		});

		test('should not increment count across diffferent deduplications', () => {
			expect(deduper.add('abc')).toEqual('abc');
			expect(deduper.add('abc')).toEqual('abc (1)');
			expect(deduper.add('def')).toEqual('def');
			expect(deduper.add('def')).toEqual('def (1)');
		});

		test('should preserve extension when deduplicating', () => {
			expect(deduper.add('document.pdf')).toBe('document.pdf');
			expect(deduper.add('document.pdf')).toBe('document.pdf (1)');
		});
	});

	describe('grouping', () => {
		test('should assign null or undefined to default group', () => {
			expect(deduper.add('abc', {})).toEqual('abc');
			expect(deduper.add('abc', { group: null })).toEqual('abc (1)');
		});

		test('should return original name when added for the first time to a group', () => {
			expect(deduper.add('abc', { group: '1' })).toEqual('abc');
		});

		test('should not mix group and no-group additions', () => {
			expect(deduper.add('abc')).toBe('abc');
			expect(deduper.add('abc', { group: '1' })).toBe('abc');
			expect(deduper.add('abc')).toBe('abc (1)');
			expect(deduper.add('abc', { group: '1' })).toBe('abc (1)');
		});

		test('should deduplicate names within the same group', () => {
			expect(deduper.add('abc', { group: '1' })).toEqual('abc');
			expect(deduper.add('abc', { group: '1' })).toEqual('abc (1)');
			expect(deduper.add('def', { group: '1' })).toEqual('def');
		});

		test('should not deduplicate count across different groups', () => {
			expect(deduper.add('abc', { group: '1' })).toEqual('abc');
			expect(deduper.add('abc', { group: '2' })).toEqual('abc');
		});
	});

	describe('fallback', () => {
		test('should use fallback when name is null', () => {
			expect(deduper.add(null, { fallback: 'default' })).toBe('default');
		});

		test('should use fallback when name is undefined', () => {
			expect(deduper.add(undefined, { fallback: 'default' })).toBe('default');
		});

		test('should use fallback when name is empty string', () => {
			expect(deduper.add('', { fallback: 'default' })).toBe('default');
		});

		test('should deduplicate fallback names correctly', () => {
			deduper.add('', { fallback: 'default' });
			expect(deduper.add('', { fallback: 'default' })).toBe('default (1)');
		});
	});

	describe('sanitization', () => {
		test('should sanitize name', () => {
			expect(deduper.add('./../abc')).toEqual('...abc');
		});

		test('should fallback when name sanitized to empty', () => {
			expect(deduper.add('...', { fallback: '123' })).toEqual('123');
		});

		test('should error when name sanitized to empty and no fallback', () => {
			const deduper = new NameDeduper();

			expect(() => deduper.add('...', { group: 'folder1' })).toThrow(Error);
		});

		test('should sanitize invalid filename characters', () => {
			const result = deduper.add('file<>:"|?*name');
			expect(result).not.toContain('<');
			expect(result).not.toContain('>');
			expect(result).not.toContain(':');
		});

		test('should sanitize whitespace only', () => {
			expect(() => deduper.add('   ')).toThrow('Invalid "name" provided');
		});
	});

	describe('error', () => {
		test('should throw error when sanitized name becomes empty', () => {
			expect(() => deduper.add('////')).toThrow('Invalid "name" provided');
		});

		test('should throw error when name is invalid and no fallback provided', () => {
			expect(() => deduper.add(null)).toThrow('Invalid "name" provided');
		});

		test('should throw error when name and fallback are empty', () => {
			expect(() => deduper.add('', { fallback: '' })).toThrow('Invalid "name" provided');
		});
	});
});
