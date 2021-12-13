import { merge } from 'lodash';
import { Permission } from '@directus/shared/types';
import { requireYAML } from '../../../utils/require-yaml';

const defaults: Partial<Permission> = {
	role: null,
	permissions: {},
	validation: null,
	presets: null,
	fields: ['*'],
	system: true,
};

const permissions = requireYAML(require.resolve('./api-access-permissions.yaml')) as Permission[];

export const apiAccessMinimalPermissions: Permission[] = permissions.map((row) => merge({}, defaults, row));
