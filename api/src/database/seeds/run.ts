import Knex, { ColumnBuilder } from 'knex';
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

export default async function runSeed(database: Knex) {
	const exists = await database.schema.hasTable('directus_collections');

	if (exists) {
		throw new Error('Database is already installed');
	}

	const tableSeeds = await fse.readdir(path.resolve(__dirname));

	for (const tableSeedFile of tableSeeds) {
		if (tableSeedFile === 'run.ts') continue;

		const yamlRaw = await fse.readFile(path.resolve(__dirname, tableSeedFile), 'utf8');

		const seedData = yaml.safeLoad(yamlRaw) as TableSeed;

		await database.schema.createTable(seedData.table, (tableBuilder) => {
			for (const [columnName, columnInfo] of Object.entries(seedData.columns)) {
				let column: ColumnBuilder;

				if (columnInfo.type === 'string') {
					column = tableBuilder.string(columnName, columnInfo.length);
				} else if (columnInfo.increments) {
					column = tableBuilder.increments();
				} else if (columnInfo.type === 'csv') {
					column = tableBuilder.string(columnName);
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
					tableBuilder
						.foreign(columnName)
						.references(columnInfo.references.column)
						.inTable(columnInfo.references.table);
				}
			}
		});
	}
}

// async function insertRows(database: Knex) {
// 	const rowSeeds = await fse.readdir(path.resolve(__dirname, './02-rows/'));

// 	for (const rowSeedFile of rowSeeds) {
// 		const yamlRaw = await fse.readFile(
// 			path.resolve(__dirname, './02-rows', rowSeedFile),
// 			'utf8'
// 		);
// 		const seedData = yaml.safeLoad(yamlRaw) as RowSeed;

// const dataWithDefaults = seedData.data.map((row) => {
// 	for (const [key, value] of Object.entries(row)) {
// 		if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
// 			row[key] = JSON.stringify(value);
// 		}
// 	}

// 	return merge({}, seedData.defaults, row);
// });

// 		await database.batchInsert(seedData.table, dataWithDefaults);
// 	}
// }

// async function insertFields(database: Knex) {
// 	const fieldSeeds = await fse.readdir(path.resolve(__dirname, './03-fields/'));

// 	const defaultsYaml = await fse.readFile(
// 		path.resolve(__dirname, './03-fields/_defaults.yaml'),
// 		'utf8'
// 	);
// 	const defaults = yaml.safeLoad(defaultsYaml) as FieldSeed;

// 	for (const fieldSeedFile of fieldSeeds) {
// 		const yamlRaw = await fse.readFile(
// 			path.resolve(__dirname, './03-fields', fieldSeedFile),
// 			'utf8'
// 		);
// 		const seedData = yaml.safeLoad(yamlRaw) as FieldSeed;

// 		if (fieldSeedFile === '_defaults.yaml') {
// 			continue;
// 		}

// 		const dataWithDefaults = seedData.fields.map((row) => {
// 			for (const [key, value] of Object.entries(row)) {
// 				if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
// 					(row as any)[key] = JSON.stringify(value);
// 				}
// 			}

// 			return merge({}, defaults, row);
// 		});

// 		await database.batchInsert('directus_fields', dataWithDefaults);
// 	}
// }
