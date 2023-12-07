import { randomAlpha } from '@directus/random';
import { expect, test } from 'vitest';
import { mapResult } from './map-result.js';

test('response with no relation', () => {
	const randomTitle = randomAlpha(25);

	const res = mapResult(
		[
			{ type: 'root', alias: 'id', column: 'column1' },
			{ type: 'root', alias: 'title', column: 'column2' },
		],
		{
			column1: 1, // id
			column2: randomTitle, // title
		},
		[],
	);

	expect(res).toEqual({
		id: 1,
		title: randomTitle,
	});
});

test('response with one nested table', () => {
	const res = mapResult(
		[
			{ type: 'root', alias: 'id', column: 'c1' },
			{
				type: 'nested',
				alias: 'user',
				children: [
					{ type: 'root', alias: 'id', column: 'c2' },
					{ type: 'root', alias: 'first_name', column: 'c3' },
					{ type: 'root', alias: 'last_name', column: 'c4' },
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
	);

	expect(res).toEqual({
		id: 1,
		user: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
		},
	});
});

test('response with multiple nested tables', () => {
	const res = mapResult(
		[
			{ type: 'root', alias: 'id', column: 'c1' },
			{
				type: 'nested',
				alias: 'user',
				children: [
					{ type: 'root', alias: 'id', column: 'c2' },
					{ type: 'root', alias: 'first_name', column: 'c3' },
					{ type: 'root', alias: 'last_name', column: 'c4' },
					{
						type: 'nested',
						alias: 'city',
						children: [{ type: 'root', alias: 'name', column: 'c5' }],
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
	);

	expect(res).toEqual({
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
	const res = mapResult(
		[
			{ type: 'root', alias: 'id', column: 'c1' },
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
	);

	expect(res).toEqual({
		id: 1,
		authors: [
			{ id: 1, first_name: 'John', last_name: 'Doe' },
			{ id: 2, first_name: 'Jane', last_name: 'Doe' },
		],
	});
});

test('response with multiple sub result', () => {
	const res = mapResult(
		[
			{ type: 'root', alias: 'id', column: 'c1' },
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
	);

	expect(res).toEqual({
		id: 1,
		comments: [{ id: 1, title: 'A nice comment' }],
		authors: [
			{ id: 1, first_name: 'John', last_name: 'Doe' },
			{ id: 2, first_name: 'Jane', last_name: 'Doe' },
		],
	});
});

test('response with one nested table and one sub result', () => {
	const res = mapResult(
		[
			{ type: 'root', alias: 'id', column: 'c1' },
			{
				type: 'nested',
				alias: 'user',
				children: [
					{ type: 'root', alias: 'id', column: 'c2' },
					{ type: 'root', alias: 'first_name', column: 'c3' },
					{ type: 'root', alias: 'last_name', column: 'c4' },
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
	);

	expect(res).toEqual({
		id: 1,
		user: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
			children: [{ id: 1, first_name: 'John', last_name: 'Doe' }],
		},
	});
});
