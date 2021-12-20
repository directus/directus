import { Permission, Accountability } from '@directus/shared/types';
import { SchemaOverview } from '../types';
import { assign } from 'lodash';

export function getPermissionsForShare(
	currentPermissions: Permission[],
	accountability: Accountability,
	schema: SchemaOverview
): Permission[] {
	const defaults: Permission = {
		id: undefined,
		action: 'read',
		role: accountability.role,
		collection: '',
		permissions: {},
		validation: {},
		presets: null,
		fields: null,
	};

	const { collection, item } = accountability.share_scope!;

	const parentPrimaryKeyField = schema.collections[collection].primary;

	const parentCollectionPermission: Permission = assign({}, defaults, {
		collection,
		permissions: {
			[parentPrimaryKeyField]: {
				_eq: item,
			},
		},
	});

	return [parentCollectionPermission].filter((permission) => {
		return currentPermissions.some(
			(existingPermission) =>
				existingPermission.action === permission.action && existingPermission.collection === permission.collection
		);
	});
}
