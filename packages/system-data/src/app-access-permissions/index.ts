import schemaPermissionsRaw from './schema-access-permissions.yaml';
import permissions from './app-access-permissions.yaml';
import { DataPermission, Permission } from '../types.js';

const defaults: Partial<Permission> = {
	role: null,
	permissions: {},
	validation: null,
	presets: null,
	fields: ['*'],
	system: true,
};

export const schemaPermissions = (schemaPermissionsRaw as unknown as DataPermission[]).map(
	(row) => ({ ...defaults, ...row }) as Permission,
);

export const appAccessMinimalPermissions = [...schemaPermissions, ...(permissions as unknown as DataPermission[])].map(
	(row) => ({ ...defaults, ...row }) as Permission,
);
