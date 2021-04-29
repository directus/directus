import { Knex } from 'knex';
import fse from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { types } from '../../types';
import { isObject, merge } from 'lodash';

type TableSeed = {
	table: string;
	columns: {
		[column: string]: {
			type?: typeof types[number];
			primary?: boolean;
			nullable?: boolean;
			default?: any;
			length?: number;
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

				if (columnInfo.type === 'string') {
					column = tableBuilder.string(columnName, columnInfo.length);
				} else if (columnInfo.increments) {
					column = tableBuilder.increments();
				} else if (columnInfo.type === 'csv') {
					column = tableBuilder.string(columnName);
				} else if (columnInfo.type === 'hash') {
					column = tableBuilder.string(columnName, 255);
				} else {
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
