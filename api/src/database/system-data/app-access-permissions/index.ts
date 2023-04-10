import type { Permission } from '@directus/types';
import { merge } from 'lodash-es';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireYAML } from '../../../utils/require-yaml.js';

const defaults: Partial<Permission> = {
	role: null,
	permissions: {},
	validation: null,
	presets: null,
	fields: ['*'],
	system: true,
};

const __dirname = dirname(fileURLToPath(import.meta.url));

const schemaPermissionsRaw = requireYAML(path.resolve(__dirname, './schema-access-permissions.yaml')) as Permission[];
const permissions = requireYAML(path.resolve(__dirname, './app-access-permissions.yaml')) as Permission[];

export const schemaPermissions: Permission[] = schemaPermissionsRaw.map((row) => merge({}, defaults, row));
export const appAccessMinimalPermissions: Permission[] = [...schemaPermissions, ...permissions].map((row) =>
	merge({}, defaults, row)
);
