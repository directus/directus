import type { Permission } from '@directus/shared/types';
import { merge } from 'lodash';
import { requireYAML } from '../../../utils/require-yaml';

const defaults: Partial<Permission> = {
	role: null,
	permissions: {},
	validation: null,
	presets: null,
	fields: ['*'],
	system: true,
};

const schemaPermissionsRaw = requireYAML(require.resolve('./schema-access-permissions.yaml')) as Permission[];
const permissions = requireYAML(require.resolve('./app-access-permissions.yaml')) as Permission[];

export const schemaPermissions: Permission[] = schemaPermissionsRaw.map((row) => merge({}, defaults, row));
export const appAccessMinimalPermissions: Permission[] = [...schemaPermissions, ...permissions].map((row) =>
	merge({}, defaults, row)
);
