import type { DirectusField } from '../../../schema/field.js';
import type { ApplyQueryFields } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type ReadFieldOutput<Schema extends object, Item extends object = DirectusField<Schema>> = ApplyQueryFields<
	Schema,
	Item,
	'*'
>;

/**
 * List the available fields.
 * @param query The query parameters
 * @returns An array of field objects.
 */
export const readFields =
	<Schema extends object>(): RestCommand<ReadFieldOutput<Schema>[], Schema> =>
	() => ({
		path: `/fields`,
		method: 'GET',
	});

/**
 * List the available fields in a given collection.
 * @param collection The primary key of the field
 * @returns
 */
export const readFieldsByCollection =
	<Schema extends object>(
		collection: DirectusField<Schema>['collection']
	): RestCommand<ReadFieldOutput<Schema>[], Schema> =>
	() => ({
		path: `/fields/${collection}`,
		method: 'GET',
	});

/**
 *
 * @param key The primary key of the dashboard
 * @param query The query parameters
 * @returns
 */
export const readField =
	<Schema extends object>(
		collection: DirectusField<Schema>['collection'],
		field: DirectusField<Schema>['field']
	): RestCommand<ReadFieldOutput<Schema>, Schema> =>
	() => ({
		path: `/fields/${collection}/${field}`,
		method: 'GET',
	});
