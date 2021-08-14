import { flatten, merge, omit } from 'lodash';
import { Permission } from '../types';

export function mergePermissions(operator: string, ...permissions: Permission[][]): Permission[] {
	const allPermissions = flatten(permissions);

	const mergedPermissions = allPermissions
		.reduce((acc, val) => {
			const key = `${val.collection}__${val.action}__${val.role || '$PUBLIC'}`;
			const current = acc.get(key);
			acc.set(key, current ? mergePerm(operator, current, val) : val);
			return acc;
		}, new Map())
		.values();

	const result = Array.from(mergedPermissions).map((perm) => {
		return omit(perm, ['id', 'system']) as Permission;
	});

	return result;
}

function mergeFilters(
	operator: string,
	currentFilters: Record<string, any> | null,
	newFilters: Record<string, any> | null
) {
	if (!newFilters) {
		return currentFilters;
	}

	if (currentFilters) {
		if (Object.keys(currentFilters)[0] === operator) {
			return { [operator]: [...currentFilters[operator], newFilters] };
		}

		return { [operator]: [currentFilters, newFilters] };
	}

	return { [operator]: [newFilters] };
}

function mergeFields(operator: string, currentItems: string[] | null, newItems: string[] | null): string[] | null {
	let items = currentItems;

	if (Array.isArray(newItems)) {
		if (Array.isArray(currentItems)) {
			if (operator === '_or') {
				items = [...new Set([...currentItems, ...newItems])];
			} else {
				items = newItems.filter((item) => items!.includes(item));
			}
		} else {
			items = newItems;
		}

		if (items.includes('*')) {
			if (operator === '_or') {
				items = ['*'];
			} else if (items.some((item) => item !== '*')) {
				items = items.filter((item) => item === '*');
			}
		}
	}

	return items;
}

function mergePresets(
	currentPresets: Record<string, any> | null,
	newPresets: Record<string, any> | null
): Record<string, any> | null {
	if (newPresets) {
		return merge({}, currentPresets, newPresets);
	}

	return currentPresets;
}

function mergeLimit(operator: string, currentLimit: number | null, newLimit: number | null): number | null {
	if (!Number.isInteger(newLimit)) {
		return currentLimit;
	}

	if (!Number.isInteger(currentLimit)) {
		return newLimit;
	}

	if (operator === '_or') {
		if (currentLimit === -1 || newLimit === -1) {
			return -1;
		}

		return newLimit! > currentLimit! ? newLimit : currentLimit;
	} else {
		return newLimit! >= 0 && newLimit! < currentLimit! ? newLimit : currentLimit;
	}
}

function mergePerm(operator: string, currentPerm: Permission, newPerm: Permission) {
	const permissions = mergeFilters(operator, currentPerm.permissions, newPerm.permissions);
	const validation = mergeFilters(operator, currentPerm.validation, newPerm.validation);
	const fields = mergeFields(operator, currentPerm.fields, newPerm.fields);
	const presets = mergePresets(currentPerm.presets, newPerm.presets);
	const limit = mergeLimit(operator, currentPerm.limit, newPerm.limit);

	return {
		...currentPerm,
		permissions,
		validation,
		fields,
		presets,
		limit,
	};
}
