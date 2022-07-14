import { getDatabaseClient } from '../../index';
import { DatabaseHelper } from '../types';
import { Knex } from 'knex';

type Clients = 'mysql' | 'postgres' | 'cockroachdb' | 'sqlite' | 'oracle' | 'mssql' | 'redshift';

export abstract class SchemaHelper extends DatabaseHelper {
	isOneOfClients(clients: Clients[]): boolean {
		return clients.includes(getDatabaseClient(this.knex));
	}

	async changeNullable(table: string, column: string, nullable: boolean): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			if (nullable) {
				builder.setNullable(column);
			} else {
				builder.dropNullable(column);
			}
		});
	}

	async changeToText(
		table: string,
		column: string,
		options: { nullable?: boolean; default?: any } = {}
	): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			const b = builder.string(column);

			if (options.nullable === true) {
				b.nullable();
			}

			if (options.nullable === false) {
				b.notNullable();
			}

			if (options.default !== undefined) {
				b.defaultTo(options.default);
			}

			b.alter();
		});
	}

	async changeToInteger(
		table: string,
		column: string,
		options: { nullable?: boolean; default?: any } = {}
	): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			const b = builder.integer(column);

			if (options.nullable === true) {
				b.nullable();
			}

			if (options.nullable === false) {
				b.notNullable();
			}

			if (options.default !== undefined) {
				b.defaultTo(options.default);
			}

			b.alter();
		});
	}

	async changeToString(
		table: string,
		column: string,
		options: { nullable?: boolean; default?: any; length?: number } = {}
	): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			const b = builder.string(column, options.length);

			if (options.nullable === true) {
				b.nullable();
			}

			if (options.nullable === false) {
				b.notNullable();
			}

			if (options.default !== undefined) {
				b.defaultTo(options.default);
			}

			b.alter();
		});
	}

	protected async changeToTypeByCopy<Options extends { nullable?: boolean; default?: any }>(
		table: string,
		column: string,
		options: Options,
		cb: (builder: Knex.CreateTableBuilder, column: string, options: Options) => Knex.ColumnBuilder
	): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			const col = cb(builder, `${column}__temp`, options);

			if (options.default !== undefined) {
				col.defaultTo(options.default);
			}

			// Force new temporary column to be nullable (required, as there will already be rows in
			// the table)
			col.nullable();
		});

		await this.knex(table).update(`${column}__temp`, this.knex.ref(column));

		await this.knex.schema.alterTable(table, (builder) => {
			builder.dropColumn(column);
		});

		await this.knex.schema.alterTable(table, (builder) => {
			builder.renameColumn(`${column}__temp`, column);
		});

		// We're altering the temporary column here. That starts nullable, so we only want to set it
		// to NOT NULL when applicable
		if (options.nullable === false) {
			await this.changeNullable(table, column, options.nullable);
		}
	}
}
