import type { AbstractSqlClauses } from '@directus/data-sql';
import { beforeEach, describe, expect, test } from 'vitest';
import { where } from './where.js';
import { randomIdentifier } from '@directus/random';

let sample: AbstractSqlClauses;
let conditionTargetTable: string;
let conditionTargetColumn: string;

describe('Where clause:', () => {
	beforeEach(() => {
		conditionTargetTable = randomIdentifier();
		conditionTargetColumn = randomIdentifier();

		sample = {
			select: [],
			from: randomIdentifier(),
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
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
		};
	});

	test('Where clause', () => {
		expect(where(sample)).toStrictEqual(`WHERE "${conditionTargetTable}"."${conditionTargetColumn}" > $1`);
	});

	test('Where clause with negation', () => {
		sample.where!.negate = true;

		expect(where(sample)).toStrictEqual(`WHERE "${conditionTargetTable}"."${conditionTargetColumn}" <= $1`);
	});
});
