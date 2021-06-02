import SchemaInspector from '@directus/schema';
import { Knex } from 'knex';
import { mapValues } from 'lodash';
import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import { systemCollectionRows } from '../database/system-data/collections';
import { systemFieldRows } from '../database/system-data/fields';
import logger from '../logger';
import { RelationsService } from '../services';
import { Accountability, Permission, SchemaOverview } from '../types';
import { toArray } from '../utils/to-array';
import getDefaultValue from './get-default-value';
import getLocalType from './get-local-type';
import { mergePermissions } from './merge-permissions';
import getDatabase from '../database';

export async function getSchema(options?: {
	accountability?: Accountability;
	database?: Knex;
}): Promise<SchemaOverview> {
	// Allows for use in the CLI
	const database = options?.database || getDatabase();
	const schemaInspector = SchemaInspector(database);

	const result: SchemaOverview = {
		collections: {},
		relations: [],
		permissions: [],
	};

	let permissions: Permission[] = [];

	if (options?.accountability && options.accountability.admin !== true) {
		const permissionsForRole = await database
			.select('*')
			.from('directus_permissions')
			.where({ role: options.accountability.role });

		permissions = permissionsForRole.map((permissionRaw) => {
			if (permissionRaw.permissions && typeof permissionRaw.permissions === 'string') {
				permissionRaw.permissions = JSON.parse(permissionRaw.permissions);
			}

			if (permissionRaw.validation && typeof permissionRaw.validation === 'string') {
				permissionRaw.validation = JSON.parse(permissionRaw.validation);
			}

			if (permissionRaw.presets && typeof permissionRaw.presets === 'string') {
				permissionRaw.presets = JSON.parse(permissionRaw.presets);
			}

			if (permissionRaw.fields && typeof permissionRaw.fields === 'string') {
				permissionRaw.fields = permissionRaw.fields.split(',');
			}

			return permissionRaw;
		});

		if (options.accountability.app === true) {
			permissions = mergePermissions(
				permissions,
				appAccessMinimalPermissions.map((perm) => ({ ...perm, role: options.accountability!.role }))
			);
		}
	}

	result.permissions = permissions;

	const schemaOverview = await schemaInspector.overview();

	const collections = [
		...(await database
			.select('collection', 'singleton', 'note', 'sort_field', 'accountability')
			.from('directus_collections')),
		...systemCollectionRows,
	];

	for (const [collection, info] of Object.entries(schemaOverview)) {
		if (!info.primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			continue;
		}

		const collectionMeta = collections.find((collectionMeta) => collectionMeta.collection === collection);

		result.collections[collection] = {
			collection,
			primary: info.primary,
			singleton:
				collectionMeta?.singleton === true || collectionMeta?.singleton === 'true' || collectionMeta?.singleton === 1,
			note: collectionMeta?.note || null,
			sortField: collectionMeta?.sort_field || null,
			accountability: collectionMeta ? collectionMeta.accountability : 'all',
			fields: mapValues(schemaOverview[collection].columns, (column) => ({
				field: column.column_name,
				defaultValue: getDefaultValue(column) ?? null,
				nullable: column.is_nullable ?? true,
				type: getLocalType(column) || 'alias',
				dbType: column.data_type,
				precision: column.numeric_precision || null,
				scale: column.numeric_scale || null,
				special: [],
				note: null,
				alias: false,
			})),
		};
	}

	const fields = [
		...(await database
			.select<{ id: number; collection: string; field: string; special: string; note: string | null }[]>(
				'id',
				'collection',
				'field',
				'special',
				'note'
			)
			.from('directus_fields')),
		...systemFieldRows,
	].filter((field) => (field.special ? toArray(field.special) : []).includes('no-data') === false);

	for (const field of fields) {
		if (!result.collections[field.collection]) continue;

		const existing = result.collections[field.collection].fields[field.field];

		result.collections[field.collection].fields[field.field] = {
			field: field.field,
			defaultValue: existing?.defaultValue ?? null,
			nullable: existing?.nullable ?? true,
			type: existing
				? getLocalType(schemaOverview[field.collection].columns[field.field], {
						special: field.special ? toArray(field.special) : [],
				  })
				: 'alias',
			dbType: existing?.dbType || null,
			precision: existing?.precision || null,
			scale: existing?.scale || null,
			special: field.special ? toArray(field.special) : [],
			note: field.note,
			alias: existing?.alias ?? true,
		};
	}

	const relationsService = new RelationsService({ knex: database, schema: result });
	result.relations = await relationsService.readAll();

	return result;
}
