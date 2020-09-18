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
	}
}

type RowSeed = {
	table: string;
	defaults: Record<string, any>;
	data: Record<string, any>[];
}

type FieldSeed = {
	table: string;
	fields: {
		collection: string;
		field: string;
		special: string | null;
		interface: string | null;
		options: Record<string, any> | null;
		display: string | null;
		display_options: Record<string, any> | null;
		locked: boolean;
		readonly: boolean;
		hidden: boolean;
		sort: number | null;
		width: string | null;
		group: number | null;
		translation: Record<string, any> | null;
		note: string | null;
	}[];
}

export default async function runSeed(database: Knex) {
	const exists = await database.schema.hasTable('directus_collections');

	if (exists) {
		throw new Error('Database is already installed');
	}

	await createTables(database);
	await insertRows(database);
	await insertFields(database);
}

async function createTables(database: Knex) {
	const tableSeeds = await fse.readdir(path.resolve(__dirname, './01-tables/'));

	for (const tableSeedFile of tableSeeds) {
		const yamlRaw = await fse.readFile(path.resolve(__dirname, './01-tables', tableSeedFile), 'utf8');
		const seedData = yaml.safeLoad(yamlRaw) as TableSeed;

		await database.schema.createTable(seedData.table, tableBuilder => {
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

					if (isObject(defaultValue) || Array.isArray(defaultValue))
						defaultValue = JSON.stringify(defaultValue);

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

async function insertRows(database: Knex) {
	const rowSeeds = await fse.readdir(path.resolve(__dirname, './02-rows/'));

	for (const rowSeedFile of rowSeeds) {
		const yamlRaw = await fse.readFile(path.resolve(__dirname, './02-rows', rowSeedFile), 'utf8');
		const seedData = yaml.safeLoad(yamlRaw) as RowSeed;

		const dataWithDefaults = seedData.data.map((row) => {
			for (const [key, value] of Object.entries(row)) {
				if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
					row[key] = JSON.stringify(value);
				}
			}

			return merge({}, seedData.defaults, row);
		});

		await database.batchInsert(seedData.table, dataWithDefaults);
	}
}

async function insertFields(database: Knex) {
	const fieldSeeds = await fse.readdir(path.resolve(__dirname, './03-fields/'));

	const defaultsYaml = await fse.readFile(path.resolve(__dirname, './03-fields/_defaults.yaml'), 'utf8');
	const defaults = yaml.safeLoad(defaultsYaml) as FieldSeed;

	for (const fieldSeedFile of fieldSeeds) {
		const yamlRaw = await fse.readFile(path.resolve(__dirname, './03-fields', fieldSeedFile), 'utf8');
		const seedData = yaml.safeLoad(yamlRaw) as FieldSeed;

		if (fieldSeedFile === '_defaults.yaml') {
			continue;
		}

		const dataWithDefaults = seedData.fields.map((row) => {
			for (const [key, value] of Object.entries(row)) {
				if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
					(row as any)[key] = JSON.stringify(value);
				}
			}

			return merge({}, defaults, row);
		});

		await database.batchInsert('directus_fields', dataWithDefaults);
	}
}
