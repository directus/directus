import type { ConditionLetterNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test } from 'vitest';
import type { AbstractSqlQueryConditionNode } from '../../../../types.js';
import { parameterIndexGenerator } from '../../../../utils/param-index-generator.js';
import { convertLetterNode } from './letter.js';

test('number', () => {
	const idGen = parameterIndexGenerator();
	const randomCollection = randomIdentifier();
	const randomField = randomIdentifier();

	const con: ConditionLetterNode = {
		type: 'condition-letter',
		target: {
			type: 'primitive',
			field: randomField,
		},
		operation: 'contains',
		compareTo: 'something',
	};

	const expectedWhere: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: false,
		condition: {
			type: 'condition-letter',
			target: {
				type: 'primitive',
				table: randomCollection,
				column: randomField,
			},
			operation: 'contains',
			compareTo: {
				type: 'value',
				parameterIndex: 0,
			},
		},
	};

	expect(convertLetterNode(con, randomCollection, idGen, false)).toStrictEqual({
		where: expectedWhere,
		parameters: [con.compareTo],
	});
});
