import type { Permission } from '@directus/types';
import { isPlainObject } from 'lodash-es';

export interface DynamicVariableContext {
	$CURRENT_USER: Set<string>;
	$CURRENT_ROLE: Set<string>;
	$CURRENT_ROLES: Set<string>;
	$CURRENT_POLICIES: Set<string>;
}

const placeholders = ['$CURRENT_USER', '$CURRENT_ROLE', '$CURRENT_ROLES', '$CURRENT_POLICIES'] as const;

export function createDynamicVariableContext(): DynamicVariableContext {
	return {
		$CURRENT_USER: new Set<string>(),
		$CURRENT_ROLE: new Set<string>(),
		$CURRENT_ROLES: new Set<string>(),
		$CURRENT_POLICIES: new Set<string>(),
	};
}

/**
 * Records the field a single `$CURRENT_*` reference needs. Exposed separately so a walk that
 * already visits every value can collect the context in passing, instead of making a second pass.
 */
export function collectDynamicVariableContext(value: unknown, context: DynamicVariableContext): void {
	if (typeof value !== 'string') return;

	for (const placeholder of placeholders) {
		if (value.startsWith(`${placeholder}.`)) {
			context[placeholder].add(value.slice(placeholder.length + 1));
		}
	}
}

export function extractRequiredDynamicVariableContextForPermissions(permissions: Permission[]) {
	let permissionContext = createDynamicVariableContext();

	for (const permission of permissions) {
		permissionContext = mergeContexts(permissionContext, extractRequiredDynamicVariableContext(permission.permissions));

		permissionContext = mergeContexts(permissionContext, extractRequiredDynamicVariableContext(permission.validation));
		permissionContext = mergeContexts(permissionContext, extractRequiredDynamicVariableContext(permission.presets));
	}

	return permissionContext;
}

/**
 * Iterative rather than recursive, so input deeper than the call stack allows is walked rather
 * than overflowing.
 */
export function extractRequiredDynamicVariableContext(val: any): DynamicVariableContext {
	const context = createDynamicVariableContext();
	const stack: unknown[] = [val];
	let first = true;

	while (stack.length > 0) {
		const value = stack.pop();
		const isRoot = first;
		first = false;

		let children: unknown[];

		if (Array.isArray(value)) {
			children = value;
		} else if (isPlainObject(value)) {
			children = Object.values(value as Record<string, unknown>);
		} else {
			// The root is not a value of anything, so it holds no reference to collect
			if (!isRoot) collectDynamicVariableContext(value, context);
			continue;
		}

		for (const child of children) stack.push(child);
	}

	return context;
}

function mergeContexts(context1: DynamicVariableContext, context2: DynamicVariableContext) {
	const permissionContext: DynamicVariableContext = {
		$CURRENT_USER: new Set([...context1.$CURRENT_USER, ...context2.$CURRENT_USER]),
		$CURRENT_ROLE: new Set([...context1.$CURRENT_ROLE, ...context2.$CURRENT_ROLE]),
		$CURRENT_ROLES: new Set([...context1.$CURRENT_ROLES, ...context2.$CURRENT_ROLES]),
		$CURRENT_POLICIES: new Set([...context1.$CURRENT_POLICIES, ...context2.$CURRENT_POLICIES]),
	};

	return permissionContext;
}
