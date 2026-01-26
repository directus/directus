import { describe, expect, it } from 'vitest';
import { isDetailedUpdateSyntax } from './is-detailed-update-syntax.js';

describe('isDetailedUpdateSyntax', () => {
	it('returns true for valid detailed update syntax', () => {
		const value = {
			create: [{ name: 'A' }],
			update: [{ id: 1, name: 'B' }],
			delete: [2],
		};

		expect(isDetailedUpdateSyntax(value)).toBe(true);
	});

	it('returns true for empty arrays in valid syntax', () => {
		const value = {
			create: [],
			update: [],
			delete: [],
		};

		expect(isDetailedUpdateSyntax(value)).toBe(true);
	});

	it('returns false for partial syntax (missing update)', () => {
		const value = {
			create: [],
			delete: [],
		};

		expect(isDetailedUpdateSyntax(value)).toBe(false);
	});

	it('returns false for non-array values in keys', () => {
		const value = {
			create: [],
			update: {},
			delete: [],
		};

		expect(isDetailedUpdateSyntax(value)).toBe(false);
	});

	it('returns false for plain objects without syntax keys', () => {
		const value = {
			name: 'John',
			age: 30,
		};

		expect(isDetailedUpdateSyntax(value)).toBe(false);
	});

	it('returns false for arrays', () => {
		expect(isDetailedUpdateSyntax([])).toBe(false);
	});

	it('returns false for null', () => {
		expect(isDetailedUpdateSyntax(null)).toBe(false);
	});

	it('returns false for primitives', () => {
		expect(isDetailedUpdateSyntax('string')).toBe(false);
		expect(isDetailedUpdateSyntax(123)).toBe(false);
		expect(isDetailedUpdateSyntax(true)).toBe(false);
	});

	it('returns false for objects with extra keys but correct syntax', () => {
		const value = {
			create: [],
			update: [],
			delete: [],
			extra: true,
		};

		// Strictly reject to avoid misidentifying JSON objects
		expect(isDetailedUpdateSyntax(value)).toBe(false);
	});
});
