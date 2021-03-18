import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import { Accountability, SchemaOverview, Permission, RelationRaw, Relation } from '../types';
import logger from '../logger';
import { mergePermissions } from './merge-permissions';
import { Knex } from 'knex';
import SchemaInspector from '@directus/schema';
import { mapValues, uniq } from 'lodash';

import { systemFieldRows } from '../database/system-data/fields';
import { systemRelationRows } from '../database/system-data/relations';
import getLocalType from './get-local-type';
import getDefaultValue from './get-default-value';
import { toArray } from '../utils/to-array';

export async function getSchema(options?: {
	accountability?: Accountability;
	database?: Knex;
}): Promise<SchemaOverview> {
	// Allows for use in the CLI
	const database = options?.database || (require('../database').default as Knex);
	const schemaInspector = SchemaInspector(database);

	const result: SchemaOverview = {
		full: {
			collections: {},
			relations: [],
		},
		user: {
			collections: {},
			relations: [],
			permissions: [],
		},
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

	result.user.permissions = permissions;

	const schemaOverview = await schemaInspector.overview();

	const collections = await database.select('collection', 'singleton', 'note').from('directus_collections');

	for (const [collection, info] of Object.entries(schemaOverview)) {
		if (!info.primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			continue;
		}

		const collectionMeta = collections.find((collectionMeta) => collectionMeta.collection === collection);

		result.full.collections[collection] = {
			collection,
			primary: info.primary,
			singleton: collectionMeta?.singleton === 1 || collectionMeta?.singleton === 1,
			note: collectionMeta?.note || null,
			fields: mapValues(schemaOverview[collection].columns, (column) => ({
				field: column.column_name,
				defaultValue: getDefaultValue(column) || null,
				nullable: column.is_nullable || true,
				type: getLocalType(column) || 'alias',
				precision: column.numeric_precision || null,
				scale: column.numeric_scale || null,
				special: [],
				note: null,
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
	];

	for (const field of fields) {
		const existing = result.full.collections[field.collection].fields[field.field];

		result.full.collections[field.collection].fields[field.field] = {
			field: field.field,
			defaultValue: existing?.defaultValue || null,
			nullable: existing?.nullable || false,
			type: existing
				? getLocalType(schemaOverview[field.collection].columns[field.field], {
						special: field.special ? toArray(field.special) : [],
				  })
				: 'alias',
			precision: existing?.precision || null,
			scale: existing?.scale || null,
			special: field.special ? toArray(field.special) : [],
			note: field.note,
		};
	}

	const relations: RelationRaw[] = [...(await database.select('*').from('directus_relations')), ...systemRelationRows];

	result.full.relations = relations.map((relation) => ({
		...relation,
		one_allowed_collections: relation.one_allowed_collections ? toArray(relation.one_allowed_collections) : null,
	}));

	const allowedFieldsInCollection = permissions.reduce((acc, permission) => {
		if (!acc[permission.collection]) {
			acc[permission.collection] = [];
		}

		if (permission.fields) {
			acc[permission.collection] = uniq([...acc[permission.collection], ...permission.fields]);
		}

		return acc;
	}, {} as { [collection: string]: string[] });

	for (const [collectionName, collection] of Object.entries(result.full.collections)) {
		if (
			options?.accountability?.admin === true ||
			permissions.some((permission) => permission.collection === collectionName)
		) {
			const fields: SchemaOverview['full']['collections'][string]['fields'] = {};

			for (const [fieldName, field] of Object.entries(result.full.collections[collectionName].fields)) {
				if (
					options?.accountability?.admin === true ||
					allowedFieldsInCollection[collectionName]?.includes('*') ||
					allowedFieldsInCollection[collectionName]?.includes(fieldName)
				) {
					fields[fieldName] = field;
				}
			}

			result.user.collections[collectionName] = {
				...collection,
				fields,
			};
		}
	}

	result.user.relations = result.full.relations.filter((relation) => {
		if (!options?.accountability || options.accountability.admin === true) return true;

		let collectionsAllowed = true;
		let fieldsAllowed = true;

		if (Object.keys(allowedFieldsInCollection).includes(relation.many_collection) === false) {
			collectionsAllowed = false;
		}

		if (relation.one_collection && Object.keys(allowedFieldsInCollection).includes(relation.one_collection) === false) {
			collectionsAllowed = false;
		}

		if (
			relation.one_allowed_collections &&
			relation.one_allowed_collections.every((collection) =>
				Object.keys(allowedFieldsInCollection).includes(collection)
			) === false
		) {
			collectionsAllowed = false;
		}

		if (
			!allowedFieldsInCollection[relation.many_collection] ||
			(allowedFieldsInCollection[relation.many_collection].includes('*') === false &&
				allowedFieldsInCollection[relation.many_collection].includes(relation.many_field) === false)
		) {
			fieldsAllowed = false;
		}

		if (
			relation.one_collection &&
			relation.one_field &&
			(!allowedFieldsInCollection[relation.one_collection] ||
				(allowedFieldsInCollection[relation.one_collection].includes('*') === false &&
					allowedFieldsInCollection[relation.one_collection].includes(relation.one_field) === false))
		) {
			fieldsAllowed = false;
		}

		return collectionsAllowed && fieldsAllowed;
	});

	return result;
}
