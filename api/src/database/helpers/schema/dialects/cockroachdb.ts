import { KNEX_TYPES } from '@directus/shared/constants';
import { SchemaHelper } from '../types';

export class SchemaHelperCockroachDb extends SchemaHelper {
	async updateType(
		table: string,
		column: string,
		type: typeof KNEX_TYPES[number],
		options: { nullable?: boolean; default?: any } = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, options, (builder, column) => builder[type](column));
	}

	async changeToText(
		table: string,
		column: string,
		options: { nullable?: boolean; default?: any } = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, options, (builder, column) => builder.text(column));
	}

	async changeToString(
		table: string,
		column: string,
		options: { nullable?: boolean; default?: any; length?: number } = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, options, (builder, column, options) =>
			builder.string(column, options.length)
		);
	}

	async changeToInteger(
		table: string,
		column: string,
		options: { nullable?: boolean; default?: any } = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, options, (builder, column) => builder.integer(column));
	}
}
