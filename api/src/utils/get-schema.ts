import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import { Accountability, SchemaOverview, Permission } from '../types';
import logger from '../logger';
import { mergePermissions } from './merge-permissions';
import Knex from 'knex';
import SchemaInspector from '@directus/schema';

export async function getSchema(options?: {
	accountability?: Accountability;
	database?: Knex;
}): Promise<SchemaOverview> {
	// Allows for use in the CLI
	const database = options?.database || (require('../database').default as Knex);
	const schemaInspector = SchemaInspector(database);

	const schemaOverview = await schemaInspector.overview();

	for (const [collection, info] of Object.entries(schemaOverview)) {
		if (!info.primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			delete schemaOverview[collection];
		}
	}

	const relations = await database.select('*').from('directus_relations');

	const fields = await database
		.select<{ id: number; collection: string; field: string; special: string }[]>(
			'id',
			'collection',
			'field',
			'special'
		)
		.from('directus_fields');

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

	return {
		tables: schemaOverview,
		relations: relations,
		fields: fields.map((transform) => ({
			...transform,
			special: transform.special?.split(','),
		})),
		permissions: permissions,
	};
}
