import type { LogicalFilterAND, LogicalFilterOR, Permission } from '@directus/types';
import { flatten, intersection, isEqual, merge, omit } from 'lodash-es';

export function mergePermissions(strategy: 'and' | 'or', ...permissions: Permission[][]): Permission[] {
	const allPermissions = flatten(permissions);

	const mergedPermissions = allPermissions
		.reduce((acc, val) => {
			const key = `${val.collection}__${val.action}__${val.role || '$PUBLIC'}`;
			const current = acc.get(key);
			acc.set(key, current ? mergePermission(strategy, current, val) : val);
			return acc;
		}, new Map())
		.values();

	return Array.from(mergedPermissions);
}

export function mergePermission(
	strategy: 'and' | 'or',
	currentPerm: Permission,
	newPerm: Permission
): Omit<Permission, 'id' | 'system'> {
	const logicalKey = `_${strategy}` as keyof LogicalFilterOR | keyof LogicalFilterAND;

	let permissions = currentPerm.permissions;
	let validation = currentPerm.validation;
	let fields = currentPerm.fields;
	let presets = currentPerm.presets;

	if (newPerm.permissions) {
		if (currentPerm.permissions && Object.keys(currentPerm.permissions)[0] === logicalKey) {
			permissions = {
				[logicalKey]: [
					...(currentPerm.permissions as LogicalFilterOR & LogicalFilterAND)[logicalKey],
					newPerm.permissions,
				],
			} as LogicalFilterAND | LogicalFilterOR;
		} else if (currentPerm.permissions) {
			// Empty {} supersedes other permissions in _OR merge
			if (strategy === 'or' && (isEqual(currentPerm.permissions, {}) || isEqual(newPerm.permissions, {}))) {
				permissions = {};
			} else {
				permissions = {
					[logicalKey]: [currentPerm.permissions, newPerm.permissions],
				} as LogicalFilterAND | LogicalFilterOR;
			}
		} else {
			permissions = {
				[logicalKey]: [newPerm.permissions],
			} as LogicalFilterAND | LogicalFilterOR;
		}
	}

	if (newPerm.validation) {
		if (currentPerm.validation && Object.keys(currentPerm.validation)[0] === logicalKey) {
			validation = {
				[logicalKey]: [
					...(currentPerm.validation as LogicalFilterOR & LogicalFilterAND)[logicalKey],
					newPerm.validation,
				],
			} as LogicalFilterAND | LogicalFilterOR;
		} else if (currentPerm.validation) {
			// Empty {} supersedes other validations in _OR merge
			if (strategy === 'or' && (isEqual(currentPerm.validation, {}) || isEqual(newPerm.validation, {}))) {
				validation = {};
			} else {
				validation = {
					[logicalKey]: [currentPerm.validation, newPerm.validation],
				} as LogicalFilterAND | LogicalFilterOR;
			}
		} else {
			validation = {
				[logicalKey]: [newPerm.validation],
			} as LogicalFilterAND | LogicalFilterOR;
		}
	}

	if (newPerm.fields) {
		if (Array.isArray(currentPerm.fields) && strategy === 'or') {
			fields = [...new Set([...currentPerm.fields, ...newPerm.fields])];
		} else if (Array.isArray(currentPerm.fields) && strategy === 'and') {
			fields = intersection(currentPerm.fields, newPerm.fields);
		} else {
			fields = newPerm.fields;
		}

		if (fields.includes('*')) fields = ['*'];
	}

	if (newPerm.presets) {
		presets = merge({}, presets, newPerm.presets);
	}

	return omit(
		{
			...currentPerm,
			permissions,
			validation,
			fields,
			presets,
		},
		['id', 'system']
	);
}
