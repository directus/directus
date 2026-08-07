import { ErrorCode, isDirectusError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import { extractError } from './sqlite.js';
import type { SQLiteError } from './types.js';

/**
 * Backwards compatibility test
 */
const nodeSqlite3 = (message: string): SQLiteError => ({ message, code: 'SQLITE_CONSTRAINT', errno: 19 });

const betterSqlite3 = (message: string, code: string): SQLiteError => ({
	message,
	code,
	errno: undefined as unknown as number,
});

describe('sqlite extractError', () => {
	describe('not null violations', () => {
		test.each([
			[
				'node-sqlite3',
				nodeSqlite3(
					'insert into `articles` (`title`) values (NULL) - SQLITE_CONSTRAINT: NOT NULL constraint failed: articles.title',
				),
			],
			[
				'better-sqlite3',
				betterSqlite3(
					'insert into `articles` (`title`) values (NULL) - NOT NULL constraint failed: articles.title',
					'SQLITE_CONSTRAINT_NOTNULL',
				),
			],
		])('translates a %s not null violation', (_driver, error) => {
			const result = extractError(error, {});

			expect(isDirectusError(result, ErrorCode.NotNullViolation)).toBe(true);
			expect((result as any).extensions).toMatchObject({ collection: 'articles', field: 'title' });
		});

		test('reports a not null violation on a knex alter table as ContainsNullValues', () => {
			const error = betterSqlite3('NOT NULL constraint failed: _knex_temp_alter123.title', 'SQLITE_CONSTRAINT_NOTNULL');

			const result = extractError(error, {});

			expect(isDirectusError(result, ErrorCode.ContainsNullValues)).toBe(true);
			expect((result as any).extensions).toMatchObject({ collection: '_knex_temp_alter123', field: 'title' });
		});
	});

	describe('unique violations', () => {
		test.each([
			[
				'node-sqlite3',
				nodeSqlite3(
					"insert into `articles` (`title`) values ('one') - SQLITE_CONSTRAINT: UNIQUE constraint failed: articles.title",
				),
			],
			[
				'better-sqlite3',
				betterSqlite3(
					"insert into `articles` (`title`) values ('one') - UNIQUE constraint failed: articles.title",
					'SQLITE_CONSTRAINT_UNIQUE',
				),
			],
		])('translates a %s unique violation and keeps the offending value', (_driver, error) => {
			const result = extractError(error, { title: 'one' });

			expect(isDirectusError(result, ErrorCode.RecordNotUnique)).toBe(true);

			expect((result as any).extensions).toMatchObject({
				collection: 'articles',
				field: 'title',
				value: 'one',
			});
		});

		test('translates a primary key violation as a unique violation', () => {
			const error = betterSqlite3('UNIQUE constraint failed: articles.id', 'SQLITE_CONSTRAINT_PRIMARYKEY');

			expect(isDirectusError(extractError(error, {}), ErrorCode.RecordNotUnique)).toBe(true);
		});
	});

	describe('foreign key violations', () => {
		test.each([
			[
				'node-sqlite3',
				nodeSqlite3(
					'insert into `articles` (`author`) values (9999) - SQLITE_CONSTRAINT: FOREIGN KEY constraint failed',
				),
			],
			[
				'better-sqlite3',
				betterSqlite3(
					'insert into `articles` (`author`) values (9999) - FOREIGN KEY constraint failed',
					'SQLITE_CONSTRAINT_FOREIGNKEY',
				),
			],
		])('translates a %s foreign key violation', (_driver, error) => {
			const result = extractError(error, {});

			expect(isDirectusError(result, ErrorCode.InvalidForeignKey)).toBe(true);
		});
	});

	test('passes through unrelated errors untouched', () => {
		const error = betterSqlite3('no such table: articles', 'SQLITE_ERROR');

		expect(extractError(error, {})).toBe(error);
	});
});
