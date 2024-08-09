import { test, expect } from 'vitest';
import { preprocessBindings } from './preprocess-bindings.js';

const format = (index: number) => `$${index + 1}`;

test('Returns an escaped question mark, so it stays escaped', () => {
	expect(preprocessBindings(`SELECT * FROM table WHERE column = "\\?"`, { format }).sql).toEqual(
		'SELECT * FROM table WHERE column = "\\?"',
	);

	expect(preprocessBindings(`SELECT * FROM table WHERE column = "\\\\\\?"`, { format }).sql).toEqual(
		'SELECT * FROM table WHERE column = "\\\\\\?"',
	);
});

test('Replaces question marks with $1, $2, etc.', () => {
	const bindings = preprocessBindings(
		{ sql: `SELECT * FROM table WHERE column = ? LIMIT ?`, bindings: [1, 100] },
		{ format },
	);

	expect(bindings.sql).toEqual('SELECT * FROM table WHERE column = $1 LIMIT $2');
	expect(bindings.bindings).toEqual([1, 100]);
});

test('Replaces question marks with $1, $2, etc. and skips duplicates', () => {
	const bindings = preprocessBindings(
		{
			sql: `SELECT * FROM table WHERE column = ? AND other = ? LIMIT ?`,
			bindings: [10, 'foo', 10],
		},
		{ format },
	);

	expect(bindings.sql).toEqual('SELECT * FROM table WHERE column = $1 AND other = $2 LIMIT $1');
	expect(bindings.bindings).toEqual([10, 'foo']);
});
