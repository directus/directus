import type { Permission } from '@directus/types';
import schemaPermissionsRaw from './schema-access-permissions.yaml';
import permissions from './app-access-permissions.yaml';

const defaults: Partial<Permission> = {
	role: null,
	permissions: {},
	validation: null,
	presets: null,
	fields: ['*'],
	system: true,
};

export const schemaPermissions: Permission[] = schemaPermissionsRaw.map((row: Permission) => ({ ...defaults, ...row }));

export const appAccessMinimalPermissions: Permission[] = [...schemaPermissions, ...(permissions as Permission[])].map(
	(row) => ({ ...defaults, ...row }),
);
