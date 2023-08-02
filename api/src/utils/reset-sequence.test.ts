import { describe, expect, test } from 'vitest';
import { pkWasProvided } from './reset-sequence.js';

describe('PK is given in body', () => {
	test('id given', () => {
		expect(
			pkWasProvided(
				{
					id: 1,
					foo: 'bar',
				},
				'id'
			)
		).toBe(true);
	});

	test('no id given', () => {
		expect(
			pkWasProvided(
				{
					foo: 'bar',
				},
				'id'
			)
		).toBe(false);
	});

	test('id given within multiple items', () => {
		expect(
			pkWasProvided(
				[
					{
						foo: 'bar',
					},
					{
						id: 1,
						foo: 'bar',
					},
				],
				'id'
			)
		).toBe(true);
	});

	test('id not given within multiple items', () => {
		expect(
			pkWasProvided(
				[
					{
						foo: 'bar',
					},
					{
						foo: 'bar',
					},
				],
				'id'
			)
		).toBe(false);
	});
});
