import { AbstractServiceOptions, Accountability, PrimaryKey } from "../types";
import database from '../database';
import Knex from 'knex';
import { InvalidPayloadException, ForbiddenException } from '../exceptions';
import SchemaInspector from 'knex-schema-inspector';

export default class UtilsService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	async sort(collection: string, { from, to }: { from: PrimaryKey, to: PrimaryKey }) {
		const schemaInspector = SchemaInspector(this.knex);

		const sortFieldResponse = await this.knex
			.select('sort_field')
			.from('directus_collections')
			.where({ collection })
			.first();

		const sortField = sortFieldResponse?.sort_field;

		if (!sortField) {
			throw new InvalidPayloadException(`Collection "${collection}" doesn't have a sort field.`);
		}

		if (this.accountability?.admin !== true) {
			const permissions = await this.knex.select('fields').from('directus_permissions').where({ role: this.accountability?.role || null, collection }).first();

			if (!permissions) {
				throw new ForbiddenException();
			}

			const allowedFields = permissions.fields.split(',');

			if (allowedFields[0] !== '*' && allowedFields.includes(sortField) === false) {
				throw new ForbiddenException();
			}
		}

		const primaryKeyField = await schemaInspector.primary(collection);

		// Make sure all rows have a sort value
		const countResponse = await this.knex.count('*').from(collection).whereNull(sortField).first();
		if (countResponse?.count && +countResponse.count !== 0) {
			const lastSortValueResponse = await this.knex.max(sortField).from(collection).first();
			const rowsWithoutSortValue = await this.knex.select(primaryKeyField, sortField).from(collection).whereNull(sortField).orderBy(primaryKeyField);

			let lastSortValue = lastSortValueResponse!.max;

			for (const row of rowsWithoutSortValue) {
				lastSortValue++;
				await this.knex(collection).update({ [sortField]: lastSortValue }).where({ [primaryKeyField]: row[primaryKeyField] });
			}
		}


	}
}
