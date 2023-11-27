import { expect, test } from 'vitest';
import { fieldCondition } from './field-condition.js';
import { randomIdentifier } from '@directus/random';

test('field condition', () => {
	const table1 = randomIdentifier();
	const table2 = randomIdentifier();
	const column1 = randomIdentifier();
	const column2 = randomIdentifier();

	const res = fieldCondition(
		{
			type: 'condition-field',
			target: {
				type: 'primitive',
				table: table1,
				column: column1,
			},
			operation: 'eq',
			compareTo: {
				type: 'primitive',
				table: table2,
				column: column2,
			},
		},
		false,
	);

	expect(res).toStrictEqual(`"${table1}"."${column1}" = "${table2}"."${column2}"`);
});
