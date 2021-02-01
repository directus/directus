import { AbstractServiceOptions, Accountability, PrimaryKey, SchemaOverview } from '../types';
import database from '../database';
import Knex from 'knex';
import { InvalidPayloadException, ForbiddenException } from '../exceptions';
import { systemCollectionRows } from '../database/system-data/collections';

export class UtilsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async sort(collection: string, { item, to }: { item: PrimaryKey; to: PrimaryKey }) {
		const sortFieldResponse =
			(await this.knex.select('sort_field').from('directus_collections').where({ collection }).first()) ||
			systemCollectionRows;

		const sortField = sortFieldResponse?.sort_field;

		if (!sortField) {
			throw new InvalidPayloadException(`Collection "${collection}" doesn't have a sort field.`);
		}

		if (this.accountability?.admin !== true) {
			const permissions = await this.knex
				.select('fields')
				.from('directus_permissions')
				.where({
					collection,
					action: 'update',
					role: this.accountability?.role || null,
				})
				.first();

			if (!permissions) {
				throw new ForbiddenException();
			}

			const allowedFields = permissions.fields.split(',');

			if (allowedFields[0] !== '*' && allowedFields.includes(sortField) === false) {
				throw new ForbiddenException();
			}
		}

		const primaryKeyField = this.schema[collection].primary;

		// Make sure all rows have a sort value
		const countResponse = await this.knex.count('* as count').from(collection).whereNull(sortField).first();

		if (countResponse?.count && +countResponse.count !== 0) {
			const lastSortValueResponse = await this.knex.max(sortField).from(collection).first();

			const rowsWithoutSortValue = await this.knex
				.select(primaryKeyField, sortField)
				.from(collection)
				.whereNull(sortField);

			let lastSortValue = lastSortValueResponse ? Object.values(lastSortValueResponse)[0] : 0;

			for (const row of rowsWithoutSortValue) {
				lastSortValue++;
				await this.knex(collection)
					.update({ [sortField]: lastSortValue })
					.where({ [primaryKeyField]: row[primaryKeyField] });
			}
		}

		const targetSortValueResponse = await this.knex
			.select(sortField)
			.from(collection)
			.where({ [primaryKeyField]: to })
			.first();
		const targetSortValue = targetSortValueResponse[sortField];

		const sourceSortValueResponse = await this.knex
			.select(sortField)
			.from(collection)
			.where({ [primaryKeyField]: item })
			.first();
		const sourceSortValue = sourceSortValueResponse[sortField];

		// Set the target item to the new sort value
		await this.knex(collection)
			.update({ [sortField]: targetSortValue })
			.where({ [primaryKeyField]: item });

		if (sourceSortValue < targetSortValue) {
			await this.knex(collection)
				.decrement(sortField, 1)
				.where(sortField, '>', sourceSortValue)
				.andWhere(sortField, '<=', targetSortValue)
				.andWhereNot({ [primaryKeyField]: item });
		} else {
			await this.knex(collection)
				.increment(sortField, 1)
				.where(sortField, '>=', targetSortValue)
				.andWhere(sortField, '<=', sourceSortValue)
				.andWhereNot({ [primaryKeyField]: item });
		}
	}
}
