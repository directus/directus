import type { AbstractSqlClauses } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { where } from './where.js';
import { randomIdentifier, randomInteger } from '@directus/random';

let sample: AbstractSqlClauses;
let foreignTableName: string;
let targetTableIndex: number;
let foreignColumnName: string;
let foreignColumnIndex: number;

beforeEach(() => {
	foreignTableName = randomIdentifier();
	foreignColumnName = randomIdentifier();
	foreignColumnIndex = randomInteger(0, 100);
	targetTableIndex = randomInteger(0, 100);

	sample = {
		select: [],
		from: {
			tableName: randomIdentifier(),
			tableIndex: 0,
		},
		where: {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-number',
				operation: 'gt',
				target: {
					type: 'primitive',
					tableIndex: targetTableIndex,
					columnName: foreignColumnName,
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
	expect(where(sample)).toStrictEqual(`WHERE "t${targetTableIndex}"."${foreignColumnName}" > $1`);
});

test('Where clause with negation', () => {
	sample.where!.negate = true;
	expect(where(sample)).toStrictEqual(`WHERE "t${targetTableIndex}"."${foreignColumnName}" <= $1`);
});
