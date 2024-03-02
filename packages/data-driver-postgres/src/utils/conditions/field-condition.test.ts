import { expect, test } from 'vitest';
import { fieldCondition } from './field-condition.js';
import { randomIdentifier, randomInteger } from '@directus/random';

test('field condition', () => {
	const tableIndex1 = randomInteger(0, 100);
	const tableIndex2 = randomInteger(0, 100);
	const columnName1 = randomIdentifier();
	const columnName2 = randomIdentifier();

	const res = fieldCondition(
		{
			type: 'condition-field',
			target: {
				type: 'primitive',
				tableIndex: tableIndex1,
				columnName: columnName1,
			},
			operation: 'eq',
			compareTo: {
				type: 'primitive',
				tableIndex: tableIndex2,
				columnName: columnName2,
			},
		},
		false,
	);

	expect(res).toStrictEqual(`"t${tableIndex1}"."${columnName1}" = "t${tableIndex2}"."${columnName2}"`);
});

test('comparing two json props', () => {
	const tableIndex1 = randomInteger(0, 100);
	const tableIndex2 = randomInteger(0, 100);
	const columnName1 = randomIdentifier();
	const columnName2 = randomIdentifier();

	const res = fieldCondition(
		{
			type: 'condition-field',
			target: {
				type: 'json',
				tableIndex: tableIndex1,
				columnName: columnName1,
				path: [1],
			},
			operation: 'eq',
			compareTo: {
				type: 'json',
				tableIndex: tableIndex2,
				columnName: columnName2,
				path: [5],
			},
		},
		false,
	);

	const expected = `"t${tableIndex1}"."${columnName1}" ->> $2 = "t${tableIndex2}"."${columnName2}" ->> $6`;
	expect(res).toStrictEqual(expected);
});

test('compare json prop to field used for a2o', () => {
	const tableIndex1 = randomInteger(0, 100);
	const tableIndex2 = randomInteger(0, 100);
	const columnName1 = randomIdentifier();
	const columnName2 = randomIdentifier();

	const res = fieldCondition(
		{
			type: 'condition-field',
			target: {
				type: 'json',
				tableIndex: tableIndex1,
				columnName: columnName1,
				path: [1],
			},
			operation: 'eq',
			compareTo: {
				type: 'primitive',
				tableIndex: tableIndex2,
				columnName: columnName2,
			},
		},
		false,
	);

	const expected = `"t${tableIndex1}"."${columnName1}" ->> $2 = "t${tableIndex2}"."${columnName2}"`;
	expect(res).toStrictEqual(expected);
});
