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

type DataPermission = Partial<Permission> & Pick<Permission, 'collection' | 'action'>;

export const schemaPermissions = (schemaPermissionsRaw as unknown as DataPermission[])
	.map((row) => ({ ...defaults, ...row } as Permission));

export const appAccessMinimalPermissions = [
	...schemaPermissions, ...(permissions as unknown as DataPermission[])
].map((row) => ({ ...defaults, ...row } as Permission));
