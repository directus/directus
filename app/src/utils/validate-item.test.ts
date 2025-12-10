import { beforeEach, describe, expect, test } from 'vitest';

import { validateItem } from '@/utils/validate-item';
import { DeepPartial, Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

const fields: DeepPartial<Field>[] = [
	{
		field: 'id',
		collection: 'users',
		type: 'integer',
		name: 'ID',
		meta: {
			required: true,
		},
		schema: null,
	},
	{
		field: 'name',
		collection: 'users',
		type: 'string',
		name: 'Name',
		meta: {
			required: true,
		},
		schema: null,
	},
	{
		field: 'email',
		collection: 'users',
		type: 'string',
		name: 'Email',
		schema: null,
	},
	{
		field: 'role',
		collection: 'users',
		type: 'integer',
		name: 'Role',
		meta: {
			required: true,
		},
		schema: null,
	},
];

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: () => (_collection, field) => {
				if (field === 'role') {
					return [{ some: 'relation' }];
				}

				return [];
			},
		}),
	);
});

test('Required fields', () => {
	let result = validateItem(
		{
			id: 1,
			name: 'test',
			email: 'test@test.com',
			role: [1, 2],
		},
		fields as Field[],
		true,
	);

	expect(result.length).toEqual(0);

	result = validateItem(
		{
			id: 1,
			name: 'test',
			email: 'test@test.com',
			role: [],
		},
		fields as Field[],
		true,
	);

	expect(result.length).toEqual(1);
});

describe('Min and max', () => {
	const integerFieldWithMin: DeepPartial<Field> = {
		field: 'age',
		collection: 'users',
		type: 'integer',
		name: 'Age',
		meta: {
			options: {
				min: 18,
			},
		},
		schema: null,
	};

	const integerFieldWithMax: DeepPartial<Field> = {
		field: 'score',
		collection: 'users',
		type: 'integer',
		name: 'Score',
		meta: {
			options: {
				max: 100,
			},
		},
		schema: null,
	};

	const integerFieldWithMinMax: DeepPartial<Field> = {
		field: 'rating',
		collection: 'users',
		type: 'integer',
		name: 'Rating',
		meta: {
			options: {
				min: 1,
				max: 5,
			},
		},
		schema: null,
	};

	test('Validation passes when number is above min', () => {
		const result = validateItem(
			{
				age: 20,
			},
			[integerFieldWithMin] as Field[],
			false,
		);

		expect(result.length).toEqual(0);
	});

	test('Validation passes when number is equal to min', () => {
		const result = validateItem(
			{
				age: 18,
			},
			[integerFieldWithMin] as Field[],
			false,
		);

		expect(result.length).toEqual(0);
	});

	test('Validation fails when number is lower than min', () => {
		const result = validateItem(
			{
				age: 17,
			},
			[integerFieldWithMin] as Field[],
			false,
		);

		expect(result.length).toEqual(1);
		expect(result[0]?.field).toEqual('age');
	});

	test('Validation passes when number is below max', () => {
		const result = validateItem(
			{
				score: 50,
			},
			[integerFieldWithMax] as Field[],
			false,
		);

		expect(result.length).toEqual(0);
	});

	test('Validation passes when number is equal to max', () => {
		const result = validateItem(
			{
				score: 100,
			},
			[integerFieldWithMax] as Field[],
			false,
		);

		expect(result.length).toEqual(0);
	});

	test('Validation fails when number is higher than max', () => {
		const result = validateItem(
			{
				score: 101,
			},
			[integerFieldWithMax] as Field[],
			false,
		);

		expect(result.length).toEqual(1);
		expect(result[0]?.field).toEqual('score');
	});

	test('Validation passes when number is within min and max', () => {
		const result = validateItem(
			{
				rating: 3,
			},
			[integerFieldWithMinMax] as Field[],
			false,
		);

		expect(result.length).toEqual(0);
	});

	test('Validation fails when number is outside of min and max', () => {
		const result = validateItem(
			{
				rating: 0,
			},
			[integerFieldWithMinMax] as Field[],
			false,
		);

		expect(result.length).toEqual(1);
		expect(result[0]?.field).toEqual('rating');
	});

	test('Integer type - null values are ignored', () => {
		const integerFieldWithMinMax: DeepPartial<Field> = {
			field: 'rating',
			collection: 'users',
			type: 'integer',
			name: 'Rating',
			meta: {
				options: {
					min: 1,
					max: 5,
				},
			},
			schema: null,
		};

		const result = validateItem(
			{
				rating: null,
			},
			[integerFieldWithMinMax] as Field[],
			false,
		);

		expect(result.length).toEqual(0);
	});

	test('Only numeric types are affected by min/max validation', () => {
		const stringFieldWithMinMax: DeepPartial<Field> = {
			field: 'name',
			collection: 'users',
			type: 'string',
			name: 'Name',
			meta: {
				options: {
					min: 1,
					max: 100,
				},
			},
			schema: null,
		};

		const result = validateItem(
			{
				name: 'test',
			},
			[stringFieldWithMinMax] as Field[],
			false,
		);

		expect(result.length).toEqual(0);
	});
});
