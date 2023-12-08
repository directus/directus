import type { AbstractQueryConditionNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createIndexGenerators, type IndexGenerators } from '../../../../utils/create-index-generators.js';
import { convertCondition } from './conditions.js';
import { convertGeoCondition } from './geo.js';
import { convertNumberNode } from './number.js';
import { convertSetCondition } from './set.js';
import { convertStringNode } from './string.js';

let sample: AbstractQueryConditionNode;
let randomCollection: string;
let indexGen: IndexGenerators;

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
	indexGen = createIndexGenerators();
});

test('Convert string condition', () => {
	vi.mock('./string.js', () => ({
		convertStringNode: vi.fn(),
	}));

	convertCondition(sample, randomCollection, indexGen, false);
	expect(convertStringNode).toHaveBeenCalledOnce();
});

test('Convert number condition', () => {
	sample.condition.type = 'condition-number';

	vi.mock('./number.js', () => ({
		convertNumberNode: vi.fn(),
	}));

	convertCondition(sample, randomCollection, indexGen, false);
	expect(convertNumberNode).toHaveBeenCalledOnce();
});

test('Convert set condition', () => {
	sample.condition.type = 'condition-set';

	vi.mock('./set.js', () => ({
		convertSetCondition: vi.fn(),
	}));

	convertCondition(sample, randomCollection, indexGen, false);
	expect(convertSetCondition).toHaveBeenCalledOnce();
});

describe('Convert field condition', () => {
	vi.mock('./geo.js', () => ({
		convertGeoCondition: vi.fn(),
	}));

	test('Convert geo points and lines condition', () => {
		sample.condition.type = 'condition-geo-intersects';
		convertCondition(sample, randomCollection, indexGen, false);
		expect(convertGeoCondition).toHaveBeenCalledOnce();
	});

	test('Convert geo points and lines condition', () => {
		sample.condition.type = 'condition-geo-intersects-bbox';
		convertCondition(sample, randomCollection, indexGen, false);
		expect(convertGeoCondition).toHaveBeenCalledOnce();
	});
});
