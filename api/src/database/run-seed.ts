import Knex, { ColumnBuilder } from 'knex';
import fse from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { types, Item } from '../types';
import { isObject, merge, reduce } from 'lodash';

type SeedData = {
	tables?: {
		[table: string]: {
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

	rows?: {
		[table: string]: {
			defaults: Record<string, any>;
			data: Record<string, any>[];
		};
	};
};

export default async function runSeed(knex: Knex, seed: string) {
	const yamlRaw = await fse.readFile(path.resolve(__dirname, './seeds', seed + '.yaml'), 'utf8');
	const seedData = yaml.safeLoad(yamlRaw) as SeedData;

	await knex.transaction(async (transaction) => {
		if (seedData.tables) {
			for (const [tableName, columns] of Object.entries(seedData.tables)) {
				await transaction.schema.dropTableIfExists(tableName);
				await transaction.schema.createTable(tableName, (table) => {
					for (const [columnName, columnInfo] of Object.entries(columns)) {
						let column: ColumnBuilder;

						if (columnInfo.type === 'string') {
							column = table.string(columnName, columnInfo.length);
						} else if (columnInfo.increments) {
							column = table.increments();
						} else {
							column = table[columnInfo.type!](columnName);
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
								defaultValue = knex.fn.now();
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
							table
								.foreign(columnName)
								.references(columnInfo.references.column)
								.inTable(columnInfo.references.table);
						}
					}
				});
			}
		}

		if (seedData.rows) {
			for (const [table, { defaults, data }] of Object.entries(seedData.rows)) {
				const dataWithDefaults = data.map((row) => {
					// Stringify all nested JSON values
					for (const [key, value] of Object.entries(row)) {
						if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
							row[key] = JSON.stringify(value);
						}
					}

					return merge({}, defaults, row);
				});

				const chunks = chunkArray(dataWithDefaults, 25);

				for (const chunk of chunks) {
					await transaction(table).insert(chunk);
				}
			}
		}
	});
}

function chunkArray(array: Item[], chunkSize: number) {
	return reduce(
		array,
		(result: Item[][], value) => {
			let lastChunk: Item[] = result[result.length - 1];

			if (lastChunk.length < chunkSize) {
				lastChunk.push(value);
			} else {
				result.push([value]);
			}

			return result;
		},
		[[]]
	);
}
