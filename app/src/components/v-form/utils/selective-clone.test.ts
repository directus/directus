import type { Field } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { selectiveClone } from './selective-clone';

/**
 * Helper to check if an object was marked as raw via markRaw().
 * markRaw sets __v_skip = true on the object.
 */
function isMarkedRaw(obj: unknown): boolean {
	if (obj === null || typeof obj !== 'object') return false;
	// markRaw sets __v_skip = true (Vue's internal ReactiveFlags.SKIP)
	return (obj as Record<string, unknown>)['__v_skip'] === true;
}

function createField(field: string, type: string): Field {
	return {
		collection: 'test',
		field,
		type: type as any,
		schema: null,
		meta: null,
		name: field,
	};
}

describe('selectiveClone', () => {
	it('deep clones regular field values', () => {
		const values = { title: 'Hello', nested: { a: 1 } };

		const fieldsMap = {
			title: createField('title', 'string'),
			nested: createField('nested', 'json'),
		};

		const result = selectiveClone(values, fieldsMap);

		// Should be a different object reference
		expect(result).not.toBe(values);
		expect(result.nested).not.toBe(values.nested);
		// But same values
		expect(result).toEqual(values);
	});

	it('marks geometry field values as raw (not reactive)', () => {
		const geoValue = {
			type: 'Point',
			coordinates: [0, 0],
		};

		const values = { title: 'Hello', location: geoValue };

		const fieldsMap = {
			title: createField('title', 'string'),
			location: createField('location', 'geometry.Point'),
		};

		const result = selectiveClone(values, fieldsMap);

		expect(result.title).toBe('Hello');
		expect(isMarkedRaw(result.location)).toBe(true);
	});

	it('handles all geometry types', () => {
		const geometryTypes = [
			'geometry',
			'geometry.Point',
			'geometry.LineString',
			'geometry.Polygon',
			'geometry.MultiPoint',
			'geometry.MultiLineString',
			'geometry.MultiPolygon',
		];

		for (const geoType of geometryTypes) {
			const values = { geo: { type: 'Point', coordinates: [0, 0] } };
			const fieldsMap = { geo: createField('geo', geoType) };

			const result = selectiveClone(values, fieldsMap);

			expect(isMarkedRaw(result.geo)).toBe(true);
		}
	});

	it('handles null and undefined values', () => {
		const values = { title: null, location: undefined };

		const fieldsMap = {
			title: createField('title', 'string'),
			location: createField('location', 'geometry.Point'),
		};

		const result = selectiveClone(values, fieldsMap);

		expect(result.title).toBe(null);
		expect(result.location).toBe(undefined);
	});

	it('handles values without corresponding field in fieldsMap', () => {
		const values = { title: 'Hello', unknown: { nested: true } };

		const fieldsMap = {
			title: createField('title', 'string'),
		};

		const result = selectiveClone(values, fieldsMap);

		// Unknown fields should be deep cloned (safe default)
		expect(result.unknown).not.toBe(values.unknown);
		expect(result.unknown).toEqual(values.unknown);
	});

	it('returns empty object when values is null or undefined', () => {
		const fieldsMap = {
			title: createField('title', 'string'),
		};

		expect(selectiveClone(null, fieldsMap)).toEqual({});
		expect(selectiveClone(undefined, fieldsMap)).toEqual({});
	});

	it('preserves $-prefixed metadata keys without cloning', () => {
		const values = { title: 'Hello', $type: 'created' };

		const fieldsMap = {
			title: createField('title', 'string'),
		};

		const result = selectiveClone(values, fieldsMap);

		expect(result.$type).toBe('created');
	});
});
