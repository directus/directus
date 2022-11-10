import { getDatabaseClient } from '../../index';
import { KNEX_TYPES } from '@directus/shared/constants';
import { DatabaseClients, DatabaseHelper } from '../types';

export type Options = { nullable?: boolean; default?: any; length?: number };

export abstract class SchemaHelper extends DatabaseHelper {
	isOneOfClients(clients: DatabaseClients[]): boolean {
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

	async changeToType(
		table: string,
		column: string,
		type: typeof KNEX_TYPES[number],
		options: Options = {}
	): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			const b = type === 'string' ? builder.string(column, options.length) : builder[type](column);

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

	protected async changeToTypeByCopy(
		table: string,
		column: string,
		type: typeof KNEX_TYPES[number],
		options: Options
	): Promise<void> {
		const tempName = `${column}__temp`;

		await this.knex.schema.alterTable(table, (builder) => {
			const col = type === 'string' ? builder.string(tempName, options.length) : builder[type](tempName);

			if (options.default !== undefined) {
				col.defaultTo(options.default);
			}

			// Force new temporary column to be nullable (required, as there will already be rows in
			// the table)
			col.nullable();
		});

		await this.knex(table).update(tempName, this.knex.ref(column));

		await this.knex.schema.alterTable(table, (builder) => {
			builder.dropColumn(column);
		});

		await this.knex.schema.alterTable(table, (builder) => {
			builder.renameColumn(tempName, column);
		});

		// We're altering the temporary column here. That starts nullable, so we only want to set it
		// to NOT NULL when applicable
		if (options.nullable === false) {
			await this.changeNullable(table, column, options.nullable);
		}
	}

	async preColumnChange(): Promise<boolean> {
		return false;
	}

	async postColumnChange(): Promise<void> {
		return;
	}

	async getVersion(): Promise<{ parsed: number[]; full: string }> {
		const version = await this.knex.select(this.knex.raw('@@version'));
		return {
			parsed: version[0]['@@version'].split('.').map((num: string) => parseInt(num, 10)),
			full: version[0]['@@version'],
		};
	}
}
