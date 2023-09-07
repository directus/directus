import { beforeEach, expect, test, vi, afterEach, describe } from 'vitest';
import { convertCondition } from './conditions.js';
import { randomIdentifier } from '@directus/random';
import { parameterIndexGenerator } from '../../../param-index-generator.js';
import type { AbstractQueryConditionNode } from '@directus/data';
import { convertStringNode } from './string.js';
import { convertNumberNode } from './number.js';
import { convertSetCondition } from './set.js';
import { convertGeoCondition } from './geo.js';

let sample: AbstractQueryConditionNode;
let randomCollection: string;
let generator: Generator<number, number, number>;

afterEach(() => {
	vi.restoreAllMocks();
});

beforeEach(() => {
	sample = {
		type: 'condition',
		// @ts-ignore - the only prop which is relevant here for the test
		condition: {
			type: 'condition-string',
		},
	};

	randomCollection = randomIdentifier();
	generator = parameterIndexGenerator();
});

test('Convert string condition', () => {
	vi.mock('./string.js', () => ({
		convertStringNode: vi.fn(),
	}));

	convertCondition(sample, randomCollection, generator, false);
	expect(convertStringNode).toHaveBeenCalledOnce();
});

test('Convert number condition', () => {
	sample.condition.type = 'condition-number';

	vi.mock('./number.js', () => ({
		convertNumberNode: vi.fn(),
	}));

	convertCondition(sample, randomCollection, generator, false);
	expect(convertNumberNode).toHaveBeenCalledOnce();
});

test('Convert set condition', () => {
	sample.condition.type = 'condition-set';

	vi.mock('./set.js', () => ({
		convertSetCondition: vi.fn(),
	}));

	convertCondition(sample, randomCollection, generator, false);
	expect(convertSetCondition).toHaveBeenCalledOnce();
});

describe('Convert field condition', () => {
	vi.mock('./geo.js', () => ({
		convertGeoCondition: vi.fn(),
	}));

	test('Convert geo points and lines condition', () => {
		sample.condition.type = 'condition-geo-intersects';
		convertCondition(sample, randomCollection, generator, false);
		expect(convertGeoCondition).toHaveBeenCalledOnce();
	});

	test('Convert geo points and lines condition', () => {
		sample.condition.type = 'condition-geo-intersects-bbox';
		convertCondition(sample, randomCollection, generator, false);
		expect(convertGeoCondition).toHaveBeenCalledOnce();
	});
});
