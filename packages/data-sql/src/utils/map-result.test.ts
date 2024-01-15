import { randomAlpha } from '@directus/random';
import { expect, test } from 'vitest';
import { mapResult } from './map-result.js';

test('response with no relation', () => {
	const title = randomAlpha(25);

	const result = mapResult(
		[
			{ type: 'root', alias: 'id', columnIndex: 1 },
			{ type: 'root', alias: 'title', columnIndex: 2 },
		],
		{
			c1: 1,
			c2: title,
		},
		[],
		(columnIndex) => `c${columnIndex}`,
	);

	expect(result).toEqual({
		id: 1,
		title,
	});
});

test('response with one nested table', () => {
	const result = mapResult(
		[
			{ type: 'root', alias: 'id', columnIndex: 1 },
			{
				type: 'nested',
				alias: 'user',
				children: [
					{ type: 'root', alias: 'id', columnIndex: 2 },
					{ type: 'root', alias: 'first_name', columnIndex: 3 },
					{ type: 'root', alias: 'last_name', columnIndex: 4 },
				],
			},
		],
		{
			c1: 1,
			c2: 1,
			c3: 'John',
			c4: 'Doe',
		},
		[],
		(columnIndex) => `c${columnIndex}`,
	);

	expect(result).toEqual({
		id: 1,
		user: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
		},
	});
});

test('response with multiple nested tables', () => {
	const result = mapResult(
		[
			{ type: 'root', alias: 'id', columnIndex: 1 },
			{
				type: 'nested',
				alias: 'user',
				children: [
					{ type: 'root', alias: 'id', columnIndex: 2 },
					{ type: 'root', alias: 'first_name', columnIndex: 3 },
					{ type: 'root', alias: 'last_name', columnIndex: 4 },
					{
						type: 'nested',
						alias: 'city',
						children: [{ type: 'root', alias: 'name', columnIndex: 5 }],
					},
				],
			},
		],
		{
			c1: 1,
			c2: 1,
			c3: 'John',
			c4: 'Doe',
			c5: 'Somewhere',
		},
		[],
		(columnIndex) => `c${columnIndex}`,
	);

	expect(result).toEqual({
		id: 1,
		user: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
			city: {
				name: 'Somewhere',
			},
		},
	});
});

test('response with one sub result', () => {
	const result = mapResult(
		[
			{ type: 'root', alias: 'id', columnIndex: 1 },
			{ type: 'sub', alias: 'authors', index: 0 },
		],
		{
			c1: 1,
		},
		[
			[
				{ id: 1, first_name: 'John', last_name: 'Doe' },
				{ id: 2, first_name: 'Jane', last_name: 'Doe' },
			],
		],
		(columnIndex) => `c${columnIndex}`,
	);

	expect(result).toEqual({
		id: 1,
		authors: [
			{ id: 1, first_name: 'John', last_name: 'Doe' },
			{ id: 2, first_name: 'Jane', last_name: 'Doe' },
		],
	});
});

test('response with multiple sub result', () => {
	const result = mapResult(
		[
			{ type: 'root', alias: 'id', columnIndex: 1 },
			{ type: 'sub', alias: 'comments', index: 1 },
			{ type: 'sub', alias: 'authors', index: 0 },
		],
		{
			c1: 1,
		},
		[
			[
				{ id: 1, first_name: 'John', last_name: 'Doe' },
				{ id: 2, first_name: 'Jane', last_name: 'Doe' },
			],
			[{ id: 1, title: 'A nice comment' }],
		],
		(columnIndex) => `c${columnIndex}`,
	);

	expect(result).toEqual({
		id: 1,
		comments: [{ id: 1, title: 'A nice comment' }],
		authors: [
			{ id: 1, first_name: 'John', last_name: 'Doe' },
			{ id: 2, first_name: 'Jane', last_name: 'Doe' },
		],
	});
});

test('response with one nested table and one sub result', () => {
	const result = mapResult(
		[
			{ type: 'root', alias: 'id', columnIndex: 1 },
			{
				type: 'nested',
				alias: 'user',
				children: [
					{ type: 'root', alias: 'id', columnIndex: 2 },
					{ type: 'root', alias: 'first_name', columnIndex: 3 },
					{ type: 'root', alias: 'last_name', columnIndex: 4 },
					{ type: 'sub', alias: 'children', index: 0 },
				],
			},
		],
		{
			c1: 1,
			c2: 1,
			c3: 'John',
			c4: 'Doe',
		},
		[[{ id: 1, first_name: 'John', last_name: 'Doe' }]],
		(columnIndex) => `c${columnIndex}`,
	);

	expect(result).toEqual({
		id: 1,
		user: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
			children: [{ id: 1, first_name: 'John', last_name: 'Doe' }],
		},
	});
});
