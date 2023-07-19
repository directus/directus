import type { AbstractSqlQuery } from '@directus/data-sql';
import { beforeEach, describe, expect, test } from 'vitest';
import { where } from './where.js';
import { randomIdentifier, randomInteger } from '@directus/random';

let sample: {
	statement: AbstractSqlQuery;
};

let conditionTargetTable = '';
let conditionTargetColumn = '';

describe('Where clause:', () => {
	beforeEach(() => {
		conditionTargetTable = randomIdentifier();
		conditionTargetColumn = randomIdentifier();

		sample = {
			statement: {
				select: [
					{
						type: 'primitive',
						column: randomIdentifier(),
						table: randomIdentifier(),
						as: randomIdentifier(),
					},
				],
				from: randomIdentifier(),
				where: {
					type: 'condition',
					negate: false,
					condition: {
						type: 'number-condition',
						operation: 'gt',
						target: {
							type: 'primitive',
							table: conditionTargetTable,
							column: conditionTargetColumn,
						},
						compareTo: {
							type: 'value',
							parameterIndex: 0,
						},
					},
				},
				parameters: [randomInteger(1, 10)],
			},
		};
	});

	test('Where clause', () => {
		expect(where(sample.statement)).toStrictEqual(`WHERE "${conditionTargetTable}"."${conditionTargetColumn}" > $1`);
	});

	test('Where clause with negation', () => {
		sample.statement.where!.negate = true;

		expect(where(sample.statement)).toStrictEqual(`WHERE "${conditionTargetTable}"."${conditionTargetColumn}" <= $1`);
	});
});
