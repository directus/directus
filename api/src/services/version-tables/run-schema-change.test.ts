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
const schema = { collections: {}, relations: [] } as unknown as SchemaOverview;

beforeEach(() => {
	calls.length = 0;
});

describe('runSchemaChange', () => {
	test('syncs the version tables after the change, within the transaction', async () => {
		const result = await runSchemaChange({ knex: db, schema }, async (_trx, change) => {
			change.sync(['articles']);
			change.sync(['authors'], { includeRelating: true });
			calls.push('change');
			return 'done';
		});

		expect(result).toBe('done');

		expect(calls).toEqual([
			'disable foreign keys',
			'begin',
			'change',
			'sync articles {}',
			'sync authors {"includeRelating":true}',
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
