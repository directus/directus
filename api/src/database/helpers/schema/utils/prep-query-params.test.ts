import { expect, test } from 'vitest';
import { prepQueryParams } from './prep-query-params.js';

const format = (index: number) => `$${index + 1}`;

test('Returns an escaped question mark, so it stays escaped', () => {
	expect(prepQueryParams(`SELECT * FROM table WHERE column = "\\?"`, { format }).sql).toEqual(
		'SELECT * FROM table WHERE column = "\\?"',
	);

	expect(prepQueryParams(`SELECT * FROM table WHERE column = "\\\\\\?"`, { format }).sql).toEqual(
		'SELECT * FROM table WHERE column = "\\\\\\?"',
	);
});

test('Replaces question marks with $1, $2, etc.', () => {
	const bindings = prepQueryParams(
		{ sql: `SELECT * FROM table WHERE column = ? LIMIT ?`, bindings: [1, 100] },
		{ format },
	);

	expect(bindings.sql).toEqual('SELECT * FROM table WHERE column = $1 LIMIT $2');
	expect(bindings.bindings).toEqual([1, 100]);
});

test('Replaces question marks with $1, $2, etc. and skips duplicates', () => {
	const bindings = prepQueryParams(
		{
			sql: `SELECT * FROM table WHERE column = ? AND other = ? LIMIT ?`,
			bindings: [10, 'foo', 10],
		},
		{ format },
	);

	expect(bindings.sql).toEqual('SELECT * FROM table WHERE column = $1 AND other = $2 LIMIT $1');
	expect(bindings.bindings).toEqual([10, 'foo']);
});

test('Replaces question marks with $1, $2, etc. and handles more than one duplicate', () => {
	const bindings = prepQueryParams(
		{
			sql: `SELECT * FROM table WHERE column in [?, ?, ?] and other in [?, ?] LIMIT ?`,
			bindings: [1, 1, 1, 100, 5, 100],
		},
		{ format },
	);

	expect(bindings.sql).toEqual('SELECT * FROM table WHERE column in [$1, $1, $1] and other in [$2, $3] LIMIT $2');

	expect(bindings.bindings).toEqual([1, 100, 5]);
});
