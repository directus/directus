import type { LogicalFilterAND, LogicalFilterOR, Permission } from '@directus/types';
import { flatten, intersection, isEqual, merge, omit, uniq } from 'lodash-es';

// Adapted from https://github.com/directus/directus/blob/141b8adbf4dd8e06530a7929f34e3fc68a522053/api/src/utils/merge-permissions.ts#L4
/**
 * Merges multiple permission lists into a flat list of unique permissions.
 * @param strategy `and` or `or` deduplicate permissions while `intersection` makes sure only common permissions across all lists are kept and overlapping permissions are merged through `and`.
 * @param permissions List of permission lists to merge.
 * @returns A flat list of unique permissions.
 */
export function mergePermissions(
	strategy: 'and' | 'or' | 'intersection',
	...permissions: Permission[][]
): Permission[] {
	let allPermissions;

	// Only keep permissions that are common to all lists
	if (strategy === 'intersection') {
		const permissionKeys = permissions.map((permissions) => {
			return new Set(permissions.map((permission) => `${permission.collection}__${permission.action}`));
		});

		const intersectionKeys = permissionKeys.reduce((acc, val) => {
			return new Set([...acc].filter((x) => val.has(x)));
		}, permissionKeys[0]!);

		const deduplicateSubpermissions = permissions.map((permissions) => {
			return mergePermissions('or', permissions);
		});

		allPermissions = flatten(deduplicateSubpermissions).filter((permission) => {
			return intersectionKeys.has(`${permission.collection}__${permission.action}`);
		});

		strategy = 'and';
	} else {
		allPermissions = flatten(permissions);
	}

	const mergedPermissions = allPermissions
		.reduce((acc, val) => {
			const key = `${val.collection}__${val.action}`;
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
	newPerm: Permission,
): Omit<Permission, 'id' | 'system'> {
	const logicalKey = `_${strategy}` as keyof LogicalFilterOR | keyof LogicalFilterAND;

	let { permissions, validation, fields, presets } = currentPerm;

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
			fields = uniq([...currentPerm.fields, ...newPerm.fields]);
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
		['id', 'system'],
	);
}
