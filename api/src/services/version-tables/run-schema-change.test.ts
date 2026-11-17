import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { runSchemaChange } from './run-schema-change.js';

const calls = vi.hoisted(() => [] as string[]);

vi.mock('../version-tables.js', () => ({
	VersionTablesService: class {
		async syncCollections(collections: string[], options?: Record<string, unknown>) {
			calls.push(`sync ${collections.join(',')} ${JSON.stringify(options ?? {})}`);
		}
	},
}));

vi.mock('../../utils/transaction.js', () => ({
	transaction: async <T>(knex: Knex, handler: (trx: Knex) => Promise<T>) => {
		calls.push('begin');

		try {
			const result = await handler(knex);
			calls.push('commit');
			return result;
		} catch (error) {
			calls.push('rollback');
			throw error;
		}
	},
}));

vi.mock('../../database/helpers/index.js', () => ({
	getHelpers: () => ({
		schema: {
			withForeignKeysDisabled: async <T>(fn: () => Promise<T>) => {
				calls.push('disable foreign keys');
				const result = await fn();
				calls.push('enable foreign keys');
				return result;
			},
		},
	}),
}));

const db = {} as Knex;
const schema = { collections: { articles: { versioned: true } }, relations: [] } as unknown as SchemaOverview;

const unversionedSchema = {
	collections: { articles: { versioned: false } },
	relations: [],
} as unknown as SchemaOverview;

beforeEach(() => {
	calls.length = 0;
});

describe('runSchemaChange', () => {
	test('syncs the version tables after the change, within the transaction', async () => {
		const result = await runSchemaChange({ knex: db, schema }, async (_trx, change) => {
			change.sync(['articles']);
			change.sync(['authors']);
			calls.push('change');
			return 'done';
		});

		expect(result).toBe('done');

		expect(calls).toEqual([
			'disable foreign keys',
			'begin',
			'change',
			'sync articles,authors {"includeRelating":true,"exclude":[]}',
			'commit',
			'enable foreign keys',
		]);
	});

	test('removes a collection from the version tables right away when it is dropped', async () => {
		await runSchemaChange({ knex: db, schema }, async (_trx, change) => {
			await change.beforeDrop('authors');
			calls.push('drop');
		});

		expect(calls).toEqual([
			'disable foreign keys',
			'begin',
			'sync authors {"includeRelating":true,"exclude":["authors"]}',
			'drop',
			'commit',
			'enable foreign keys',
		]);
	});

	test('defers the syncs of nested calls to the outermost call, syncing each collection once', async () => {
		await runSchemaChange({ knex: db, schema }, async (trx, change) => {
			change.sync(['articles']);

			await runSchemaChange({ knex: trx, schema }, async (_trx, nested) => {
				nested.sync(['articles', 'authors']);
				nested.sync(['authors']);
				calls.push('nested change');
			});

			calls.push('change');
		});

		expect(calls).toEqual([
			'disable foreign keys',
			'begin',
			'nested change',
			'change',
			'sync articles,authors {"includeRelating":true,"exclude":[]}',
			'commit',
			'enable foreign keys',
		]);
	});

	test('does not sync dropped collections after the change', async () => {
		await runSchemaChange({ knex: db, schema }, async (_trx, change) => {
			change.sync(['articles', 'authors']);
			await change.beforeDrop('authors');
		});

		expect(calls).toEqual([
			'disable foreign keys',
			'begin',
			'sync authors {"includeRelating":true,"exclude":["authors"]}',
			'sync articles,authors {"includeRelating":true,"exclude":["authors"]}',
			'commit',
			'enable foreign keys',
		]);
	});

	test('skips the syncs when the schema has no versioned collection', async () => {
		await runSchemaChange({ knex: db, schema: unversionedSchema }, async (_trx, change) => {
			change.sync(['articles']);
			await change.beforeDrop('authors');
		});

		expect(calls).toEqual(['disable foreign keys', 'begin', 'commit', 'enable foreign keys']);
	});

	test('syncs without versioned collections when the change toggles versioning', async () => {
		await runSchemaChange({ knex: db, schema: unversionedSchema }, async (trx, change) => {
			change.sync(['articles']);

			await runSchemaChange({ knex: trx, schema: unversionedSchema }, async (_trx, nested) => {
				nested.sync(['authors'], { versioningChanged: true });
			});
		});

		expect(calls).toContain('sync articles,authors {"includeRelating":true,"exclude":[]}');
	});

	test('does not sync when the change fails', async () => {
		await expect(
			runSchemaChange({ knex: db, schema }, async (_trx, change) => {
				change.sync(['articles']);
				throw new Error('failed');
			}),
		).rejects.toThrow('failed');

		expect(calls).toEqual(['disable foreign keys', 'begin', 'rollback']);
	});
});
