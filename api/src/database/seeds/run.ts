import { getHelpers } from '../helpers/index.js';
import type { Field, Type } from '@directus/types';
import fse from 'fs-extra';
import yaml from 'js-yaml';
import type { Knex } from 'knex';
import { isObject } from 'lodash-es';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

type TableSeed = {
	table: string;
	columns: {
		[column: string]: {
			type?: Type;
			primary?: boolean;
			nullable?: boolean;
			default?: any;
			length?: number | string;
			increments?: boolean;
			unsigned?: boolean;
			unique?: boolean;
			references?: {
				table: string;
				column: string;
			};
		};
	};
};

export default async function runSeed(database: Knex): Promise<void> {
	const helpers = getHelpers(database);
	const exists = await database.schema.hasTable('directus_collections');

	if (exists) {
		throw new Error('Database is already installed');
	}

	const tableSeeds = await fse.readdir(path.resolve(__dirname));

	for (const tableSeedFile of tableSeeds) {
		if (tableSeedFile.startsWith('run')) continue;

		const yamlRaw = await fse.readFile(path.resolve(__dirname, tableSeedFile), 'utf8');

		const seedData = yaml.load(yamlRaw) as TableSeed;

		await database.schema.createTable(seedData.table, (tableBuilder) => {
			for (const [columnName, columnInfo] of Object.entries(seedData.columns)) {
				let column: Knex.ColumnBuilder;

				if (columnInfo.type === 'alias' || columnInfo.type === 'unknown') return;

				if (columnInfo.type === 'string') {
					let length = columnInfo.length;

					if (length === 'MAX_TABLE_NAME_LENGTH') {
						length = helpers.schema.getTableNameMaxLength();
					} else if (length === 'MAX_COLUMN_NAME_LENGTH') {
						length = helpers.schema.getColumnNameMaxLength();
					}

					column = tableBuilder.string(columnName, Number(length));
				} else if (columnInfo.increments) {
					column = tableBuilder.increments();
				} else if (columnInfo.type === 'csv') {
					column = tableBuilder.text(columnName);
				} else if (columnInfo.type === 'hash') {
					column = tableBuilder.string(columnName, 255);
				} else if (columnInfo.type?.startsWith('geometry')) {
					column = helpers.st.createColumn(tableBuilder, { field: columnName, type: columnInfo.type } as Field);
				} else {
					// @ts-ignore
					column = tableBuilder[columnInfo.type!](columnName);
				}

				if (columnInfo.primary) {
					column.primary();
				}

				if (columnInfo.nullable !== undefined && columnInfo.nullable === false) {
					column.notNullable();
				}

				if (columnInfo.default !== undefined) {
					let defaultValue = columnInfo.default;

					if (isObject(defaultValue) || Array.isArray(defaultValue)) {
						defaultValue = JSON.stringify(defaultValue);
					}

					if (defaultValue === '$now') {
						defaultValue = database!.fn.now();
					}

					column.defaultTo(defaultValue);
				}

				if (columnInfo.unique) {
					column.unique();
				}

				if (columnInfo.unsigned) {
					column.unsigned();
				}

				if (columnInfo.references) {
					column.references(columnInfo.references.column).inTable(columnInfo.references.table);
				}
			}
		});
	}
}
