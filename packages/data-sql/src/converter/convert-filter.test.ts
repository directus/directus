import type { AbstractQueryNodeCondition } from '@directus/data';
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
	expect(convertFilter(sample.condition, sample.index)).toStrictEqual({
		where: {
			...sample.condition,
			operation: '>',
			value: {
				parameterIndex: sample.index,
			},
		},
		parameters: [sample.condition.value],
	});
});
