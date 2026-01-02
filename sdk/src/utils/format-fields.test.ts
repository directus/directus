import { describe, test, expect } from 'vitest';
import { formatFields } from './format-fields.js';

describe('formatFields', () => {
	test('should format simple string fields', () => {
		const result = formatFields(['id', 'name', 'email']);
		expect(result).toEqual(['id', 'name', 'email']);
	});

	test('should support literal strings', () => {
		const result = formatFields(['*.custom.*']);
		expect(result).toEqual(['*.custom.*']);
	});

	test('should support wildcard and custom wildcards', () => {
		const result = formatFields(['*', 'custom.*']);
		expect(result).toEqual(['*', 'custom.*']);
	});

	test('should handle empty arrays', () => {
		const result = formatFields([]);
		expect(result).toEqual([]);
	});

	test('should format nested object fields', () => {
		const result = formatFields([
			'id',
			{
				author: ['name', 'email'],
			},
		]);

		expect(result).toEqual(['id', 'author.name', 'author.email']);
	});

	test('should format many-to-any nested fields with scope', () => {
		const result = formatFields([
			{
				blocks: {
					header: ['title', 'description'],
					footer: ['title'],
				},
			},
		]);

		expect(result).toEqual(['blocks:header.title', 'blocks:header.description', 'blocks:footer.title']);
	});

	test('should handle complex nested structure with multiple levels', () => {
		const result = formatFields([
			'id',
			{
				author: [
					'name',
					{
						avatar: ['id', 'url'],
					},
				],
				categories: ['name', 'slug'],
			},
		]);

		expect(result).toEqual([
			'id',
			'author.name',
			'author.avatar.id',
			'author.avatar.url',
			'categories.name',
			'categories.slug',
		]);
	});
});
