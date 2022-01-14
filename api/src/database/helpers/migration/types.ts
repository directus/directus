import { DatabaseHelper } from '../types';
import { Knex } from 'knex';

export abstract class MigrationHelper extends DatabaseHelper {
	async changeNullable(table: string, column: string, nullable: boolean): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			if (nullable) {
				builder.setNullable(column);
			} else {
				builder.dropNullable(column);
			}
		});
	}

	async changeToText(table: string, column: string, options: { nullable?: boolean } = {}): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			const b = builder.string('url');

			if (options.nullable === true) {
				b.nullable();
			}

			if (options.nullable === false) {
				b.notNullable();
			}

			b.alter();
		});
	}

	async changeToString(
		table: string,
		column: string,
		options: { nullable?: boolean; length?: number } = {}
	): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			const b = builder.string(column, options.length);

			if (options.nullable === true) {
				b.nullable();
			}

			if (options.nullable === false) {
				b.notNullable();
			}

			b.alter();
		});
	}

	protected async changeToTypeByCopy<Options extends { nullable?: boolean }>(
		table: string,
		column: string,
		options: Options,
		cb: (builder: Knex.CreateTableBuilder, column: string, options: Options) => Knex.ColumnBuilder
	): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			cb(builder, `${column}__temp`, options).alter();
		});
		await this.knex.update(`${column}__temp`, this.knex.ref(column));
		await this.knex.schema.alterTable(table, (builder) => {
			builder.dropColumn(column);
		});
		await this.knex.schema.alterTable(table, (builder) => {
			builder.renameColumn(`${column}__temp`, column);
		});

		if (options.nullable !== undefined) {
			await this.changeNullable(table, column, options.nullable);
		}
	}
}
