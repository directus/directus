import type { AbstractQueryFieldNodePrimitive, AbstractQueryNodeCondition } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test, beforeEach } from 'vitest';
import { convertFilter } from './convert-filter.js';

let sample: {
	condition: AbstractQueryNodeCondition;
	index: number;
};

beforeEach(() => {
	sample = {
		condition: {
			type: 'condition',
			target: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			operation: 'gt',
			value: randomInteger(1, 100),
			negation: false,
		},
		index: randomInteger(1, 100),
	};
});

test('Convert filter', () => {
	const randomCollection = randomIdentifier();

	expect(convertFilter(sample.condition, sample.index, randomCollection)).toStrictEqual({
		where: {
			...sample.condition,
			operation: '>',
			value: {
				parameterIndex: sample.index,
			},
			target: {
				column: (sample.condition.target as AbstractQueryFieldNodePrimitive).field,
				table: randomCollection,
				type: 'primitive',
			},
		},
		parameters: [sample.condition.value],
	});
});
