import type { Permission } from '@directus/types';
import { merge } from 'lodash-es';
import path from 'node:path';
import { CONTEXT_ROOT } from '../../../constants.js';
import { requireYAML } from '../../../utils/require-yaml.js';

const defaults: Partial<Permission> = {
	role: null,
	permissions: {},
	validation: null,
	presets: null,
	fields: ['*'],
	system: true,
};

const permissionsPath = path.join(CONTEXT_ROOT, 'database', 'system-data', 'app-access-permissions');

const schemaPermissionsRaw = requireYAML(
	path.join(permissionsPath, './schema-access-permissions.yaml')
) as Permission[];

const permissions = requireYAML(path.join(permissionsPath, './app-access-permissions.yaml')) as Permission[];

export const schemaPermissions: Permission[] = schemaPermissionsRaw.map((row) => merge({}, defaults, row));
export const appAccessMinimalPermissions: Permission[] = [...schemaPermissions, ...permissions].map((row) =>
	merge({}, defaults, row)
);
