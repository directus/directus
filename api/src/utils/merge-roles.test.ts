import { Permission, PermissionsAction } from '../types';
import { mergeRoles } from './merge-roles';

function permissionHelper({
	id = 1,
	role = '1',
	collection = 'test',
	action = 'read' as PermissionsAction,
	permissions = {},
	validation = {},
	presets = null,
	fields = ['*'],
	limit = null,
}): Permission {
	return {
		id,
		role,
		collection,
		action,
		permissions,
		validation,
		presets,
		fields,
		limit,
	};
}

describe('merge roles', () => {
	test('permissions intersection', () => {
		const userRole: Permission[] = [permissionHelper({})];
		const maintenanceRole: Permission[] = [];

		expect(mergeRoles('intersection', userRole, maintenanceRole)).toHaveLength(0);
	});
});
