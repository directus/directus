import { expect, test } from 'vitest';
import { transformChunk } from './expand.js';
import { randomAlpha } from '@directus/random';

test('response with no relation', () => {
	const randomTitle = randomAlpha(25);

	const res = transformChunk(
		{
			alias1: 1, // id
			alias2: randomTitle, // title
		},
		new Map([
			['alias1', ['id']],
			['alias2', ['title']],
		])
	);

	expect(res).toEqual({
		id: 1,
		title: randomTitle,
	});
});

test('expand response with one nested table', () => {
	const res = transformChunk(
		{
			a1: 1,
			a2: 1,
			a3: 'John',
			a4: 'Doe',
		},
		new Map([
			['a1', ['id']],
			['a2', ['users', 'id']],
			['a3', ['users', 'first_name']],
			['a4', ['users', 'last_name']],
		])
	);

	expect(res).toEqual({
		id: 1,
		users: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
		},
	});
});

test('expand response with one nested table and a function on a nested field ', () => {
	const res = transformChunk(
		{
			a1: 1,
			a2: 1,
			a3: 'John',
			a4: 'Doe',
		},
		new Map([
			['a1', ['id']],
			['a2', ['users', 'id']],
			['a3', ['users', 'first_name']],
			['a4', ['users', 'last_name']],
		])
	);

	expect(res).toEqual({
		id: 1,
		users: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
		},
	});
});

test('expand response with multiple nested tables', () => {
	const res = transformChunk(
		{
			a1: 1,
			a2: 1,
			a3: 'John',
			a4: 'Doe',
			a5: 'somewhere',
		},
		new Map([
			['a1', ['id']],
			['a2', ['users', 'id']],
			['a3', ['users', 'first_name']],
			['a4', ['users', 'last_name']],
			['a5', ['users', 'cities', 'name']],
		])
	);

	expect(res).toEqual({
		id: 1,
		users: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
			cities: {
				name: 'somewhere',
			},
		},
	});
});
