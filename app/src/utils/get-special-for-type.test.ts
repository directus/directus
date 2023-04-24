import { TYPES } from '@directus/constants';
import { expect, test } from 'vitest';
import { getSpecialForType } from './get-special-for-type';

const castPrefixedSpecials = ['json', 'csv', 'boolean'];
const nonPrefixedSpecials = ['uuid', 'hash', 'geometry'];

test('Returns cast-prefixed special array for json, csv, and boolean field types', () => {
	const types = TYPES.filter((type) => castPrefixedSpecials.includes(type));

	for (const type of types) {
		expect(getSpecialForType(type)).toStrictEqual(['cast-' + type]);
	}
});

test('Returns special array for uuid, hash, and geometry field types', () => {
	const types = TYPES.filter((type) => nonPrefixedSpecials.includes(type));

	for (const type of types) {
		expect(getSpecialForType(type)).toStrictEqual([type]);
	}
});

test('Returns null for other field types', () => {
	const specials = [...castPrefixedSpecials, ...nonPrefixedSpecials];
	const types = TYPES.filter((type) => !specials.includes(type));

	for (const type of types) {
		expect(getSpecialForType(type)).toStrictEqual(null);
	}
});
