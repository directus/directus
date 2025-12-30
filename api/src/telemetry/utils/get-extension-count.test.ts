import { type ExtensionCount, getExtensionCount } from './get-extension-count.js';
import { ExtensionsService } from '../../services/extensions.js';
import { randomUUID } from 'crypto';
import { Knex } from 'knex';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../utils/get-schema.js');
vi.mock('../../services/extensions.js');

const mockDb: Knex = {} as Knex;

function generateParentBundleExtension(enabled: boolean) {
	return {
		id: randomUUID(),
		meta: {
			enabled,
		},
		schema: {
			type: 'bundle',
		},
	};
}

function generateNestedBundleExtension(enabled: boolean) {
	const bundle = randomUUID();

	return {
		id: randomUUID(),
		bundle,
		meta: {
			enabled,
			bundle,
		},
		schema: {
			type: 'endpoint',
		},
	};
}

function generateExtension(enabled: boolean) {
	return {
		id: randomUUID(),
		meta: {
			enabled,
		},
		schema: {
			type: 'endpoint',
		},
	};
}

function generateMissingExtension(enabled: boolean) {
	return {
		id: randomUUID(),
		meta: {
			enabled,
		},
		schema: null,
	};
}

beforeEach(() => {
	vi.mocked(ExtensionsService.prototype.readAll).mockResolvedValue([
		// Normal extensions
		generateExtension(true),
		generateExtension(true),
		generateExtension(false),
		// Parent bundle extension
		generateParentBundleExtension(true),
		generateParentBundleExtension(true),
		generateParentBundleExtension(false),
		// Extensions within a bundle
		generateNestedBundleExtension(true),
		generateNestedBundleExtension(true),
		generateNestedBundleExtension(false),
		// Missing extensions
		generateMissingExtension(true),
		generateMissingExtension(true),
		generateMissingExtension(false),
	] as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Calculates count of enabled extensions', async () => {
	const result = await getExtensionCount(mockDb);

	expect(result).toEqual({ totalEnabled: 4 } satisfies ExtensionCount);
});
