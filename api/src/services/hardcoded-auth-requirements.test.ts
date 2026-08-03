import { HARDCODED_AUTH_REQUIREMENTS } from '@directus/constants';
import { spec as staticSpec } from '@directus/specs';
import type { PathItemObject, TagObject } from 'openapi3-ts/oas30';
import { describe, expect, it } from 'vitest';

function getActionForMethod(method: string): 'create' | 'read' | 'update' | 'delete' {
	switch (method) {
		case 'post':
			return 'create';
		case 'patch':
			return 'update';
		case 'delete':
			return 'delete';
		default:
			return 'read';
	}
}

function getTagCollection(tagName: string): string | undefined {
	return staticSpec.tags?.find((tag: TagObject) => tag.name === tagName)?.['x-collection'];
}

// Inherits the POST -> create fallback below but isn't a real create permission on directus_users
// (the actual create action is ungated), so it's excluded from HARDCODED_AUTH_REQUIREMENTS.
const NOT_A_PERMISSION_ROW = new Set(['disableUserTfa']);

/**
 * Every x-authentication: admin/user operation in the static spec, deduped by collection+action
 * since multiple paths (e.g. single vs. bulk update) can share the same pair.
 */
function collectMarkedOperations() {
	const found = new Map<string, { collection: string; action: string; requiredAuth: 'admin' | 'user' }>();

	for (const pathItem of Object.values<PathItemObject>(staticSpec.paths)) {
		for (const [method, operation] of Object.entries(pathItem)) {
			const requiredAuth = operation?.['x-authentication'];

			if (requiredAuth !== 'admin' && requiredAuth !== 'user') continue;
			if (operation.operationId && NOT_A_PERMISSION_ROW.has(operation.operationId)) continue;

			const tagCollection = operation.tags?.map(getTagCollection).find((collection: string | undefined) => collection);
			const collection = operation['x-collection'] ?? tagCollection;

			if (!collection) continue;

			const action = operation['x-action'] ?? getActionForMethod(method);

			found.set(`${collection}.${action}.${requiredAuth}`, { collection, action, requiredAuth });
		}
	}

	return [...found.values()];
}

describe('HARDCODED_AUTH_REQUIREMENTS', () => {
	it('matches every x-authentication: admin/user permission row in the static spec', () => {
		const sort = (entries: Array<{ collection: string; action: string; requiredAuth: string }>) =>
			[...entries].sort((a, b) => `${a.collection}.${a.action}`.localeCompare(`${b.collection}.${b.action}`));

		expect(sort(collectMarkedOperations())).toEqual(sort([...HARDCODED_AUTH_REQUIREMENTS]));
	});
});
