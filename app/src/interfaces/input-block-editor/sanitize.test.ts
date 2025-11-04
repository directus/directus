import { describe, expect, test } from 'vitest';
import { sanitizeBlockData, sanitizeValue } from './sanitize';

describe('sanitizeValue', () => {
	describe('input handling', () => {
		test('should return null for null input', () => {
			expect(sanitizeValue(null)).toBeNull();
		});

		test('should return null for undefined input', () => {
			expect(sanitizeValue(undefined)).toBeNull();
		});

		test('should return null for non-object input', () => {
			expect(sanitizeValue('string')).toBeNull();
			expect(sanitizeValue(123)).toBeNull();
			expect(sanitizeValue(true)).toBeNull();
		});

		test('should return null for object without blocks property', () => {
			expect(sanitizeValue({ time: 123456 })).toBeNull();
		});

		test('should return null for object with empty blocks array', () => {
			expect(sanitizeValue({ blocks: [] })).toBeNull();
		});
	});
});

describe('sanitizeBlockData', () => {
	describe('input handling', () => {
		test('should return null for null input', () => {
			expect(sanitizeBlockData(null)).toBeNull();
		});

		test('should return null for undefined input', () => {
			expect(sanitizeBlockData(undefined)).toBeUndefined();
		});
	});

	describe(() => {
		test('should sanitize string data in blocks', () => {
			const result = sanitizeBlockData({
				type: 'paragraph',
				data: '<script>alert("xss")</script>Hello',
			});

			expect(result.data).toBe('Hello');
		});

		test('should sanitize object data in blocks', () => {
			const result = sanitizeBlockData({
				type: 'paragraph',
				data: {
					text: '<script>alert("xss")</script>Hello',
				},
			});

			expect(result.data.text).toBe('Hello');
		});

		test('should sanitize nested object data in blocks', () => {
			const result = sanitizeBlockData({
				type: 'custom',
				data: {
					level1: {
						level2: {
							text: '<script>xss</script>Safe text',
						},
					},
				},
			});

			expect(result.data.level1.level2.text).toBe('Safe text');
		});

		test('should sanitize array data in blocks', () => {
			const result = sanitizeBlockData({
				type: 'list',
				data: {
					items: ['<script>xss</script>Item 1', 'Item 2', 'Item 3'],
				},
			});

			expect(result.data.items[0]).toBe('Item 1');
		});
	});
});
