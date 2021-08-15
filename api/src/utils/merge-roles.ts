import { isNull, merge } from 'lodash';

import { NotImplementedException } from '../exceptions';
import { Filter, Permission, PermissionAggregator } from '../types';

export function mergeRoles(mode: 'union' | 'intersection' = 'intersection', ...roles: Permission[][]): Permission[] {
	if (mode === 'intersection') {
		return permissionsIntersection(roles);
	}

	throw new NotImplementedException(`Merge roles "${mode}" mode not implemented`);
}

function aggregate(roles: Permission[][]): PermissionAggregator[] {
	return roles.reduce((groups: PermissionAggregator[], permissions: Permission[], roleIndex) => {
		for (const permission of permissions) {
			let groupIndex = groups.findIndex(
				(group) => group.collection === permission.collection && group.action === permission.action
			);

			if (groupIndex === -1) {
				groupIndex = groups.length;
				groups.push({
					collection: permission.collection,
					action: permission.action,
					permissions: new Array(roles.length).fill(null),
					validation: new Array(roles.length).fill(null),
					limit: new Array(roles.length).fill(null),
					presets: new Array(roles.length).fill(null),
					fields: new Array(roles.length).fill(null),
				});
			}

			groups[groupIndex].permissions[roleIndex] = permission.permissions;
			groups[groupIndex].validation[roleIndex] = permission.validation;
			groups[groupIndex].limit[roleIndex] = permission.limit;
			groups[groupIndex].presets[roleIndex] = permission.presets;
			groups[groupIndex].fields[roleIndex] = permission.fields;
		}

		return groups;
	}, []);
}

function permissionsIntersection(roles: Permission[][]): Permission[] {
	return aggregate(roles)
		.filter((group: PermissionAggregator) => !group.permissions.some((permission) => isNull(permission)))
		.map((group: PermissionAggregator): Permission => {
			return {
				role: null,
				collection: group.collection,
				action: group.action,
				permissions: permissionsGroupIntersection(group.permissions),
				validation: validationGroupIntersection(group.validation),
				presets: presetsGroupIntersection(group.presets),
				fields: fieldsGroupIntersection(group.fields),
				limit: limitGroupIntersection(group.limit),
			};
		});
}

function permissionsGroupIntersection(group: (Record<string, any> | null)[]): Record<string, any> {
	group = group.filter((value) => Object.keys(value!).length);

	if (group.length === 0) {
		return {};
	} else if (group.length === 1) {
		return group[0] || {};
	}

	return { _and: group };
}

function validationGroupIntersection(group: (Filter | null)[]): Filter | null {
	group = group.filter((value) => !isNull(value));

	if (group.length === 0) {
		return null;
	} else if (group.length === 1) {
		return group[0];
	}

	group = group.filter((value) => Object.keys(value!).length);

	if (group.length === 0) {
		return {};
	} else if (group.length === 1) {
		return group[0] || {};
	}

	return { _and: group };
}

function limitGroupIntersection(group: (number | null)[]): number | null {
	group = group.filter((value) => !isNull(value));

	if (group.length === 0) {
		return null;
	} else if (group.length === 1) {
		return group[0];
	}

	group = group.filter((value) => value === -1);

	if (group.length === 0) {
		return -1;
	} else if (group.length === 1) {
		return group[0];
	}

	return group.reduce((min, value) => (value! < min! ? value : min), group[0]);
}

function presetsGroupIntersection(group: (Record<string, any> | null)[]): Record<string, any> | null {
	return merge({}, ...group);
}

function fieldsGroupIntersection(group: (string[] | null)[]): string[] | null {
	group = group.filter((value) => !isNull(value));

	if (group.length === 0) {
		return null;
	} else if (group.length === 1) {
		return group[0];
	}

	const values = group.reduce((fields, values) => {
		return (fields || []).filter((field) => values && values.includes(field));
	}, group[0]);

	return values;
}
