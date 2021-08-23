import { merge } from 'lodash';
import { Permission } from '../../../types';
import { requireYAML } from '../../../utils/require-yaml';

const defaults: Partial<Permission> = {
	role: null,
	permissions: {},
	validation: null,
	presets: null,
	fields: ['*'],
	limit: null,
	system: true,
};

const permissions = requireYAML(require.resolve('./app-access-permissions.yaml')) as Permission[];

export const appAccessMinimalPermissions: Permission[] = permissions.map((row) => merge({}, defaults, row));
