import { expect, test } from 'vitest';
import { PostgresStatement } from './statement.js';

test('a simple statement', () => {
	const statement = new PostgresStatement('articles');
	const result = statement.toString();
	expect(result).toStrictEqual('SELECT "articles".* FROM "articles";');
});
