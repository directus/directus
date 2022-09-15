import { merge } from 'lodash-es';
import type { Permission } from '@directus/shared/types';
import { requireYAML } from '../../../utils/require-yaml.js';
import { getImportFilePath } from '../../../utils/importFile.js';

const defaults: Partial<Permission> = {
	role: null,
	permissions: {},
	validation: null,
	presets: null,
	fields: ['*'],
	system: true,
};

const schemaPermissionsRaw = requireYAML(
	getImportFilePath('./database/system-data/app-access-permissions/schema-access-permissions.yaml')
) as Permission[];
const permissions = requireYAML(
	getImportFilePath('./database/system-data/app-access-permissions/app-access-permissions.yaml')
) as Permission[];

export const schemaPermissions: Permission[] = schemaPermissionsRaw.map((row) => merge({}, defaults, row));
export const appAccessMinimalPermissions: Permission[] = [...schemaPermissions, ...permissions].map((row) =>
	merge({}, defaults, row)
);
