import { ForbiddenError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { AccessService } from '../../../services/access.js';
import { PermissionsService } from '../../../services/index.js';
import type { Context } from '../../types.js';
import { validateCollectionAccess } from './lib/validate-collection-access.js';
import { validateItemAccess } from './lib/validate-item-access.js';
import { validateAccess } from './validate-access.js';

vi.mock('./lib/validate-item-access.js');
vi.mock('./lib/validate-collection-access.js');

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../../services/access.js', () => ({
	AccessService: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();

	AccessService.prototype.readByQuery = vi.fn().mockResolvedValue([]);
	PermissionsService.prototype.readByQuery = vi.fn().mockResolvedValue([]);
});

test('Returns when admin is true', async () => {
	const accountability = { admin: true } as unknown as Accountability;
	const action = 'read';
	const collection = 'collection-a';

	await expect(validateAccess({ accountability, action, collection }, {} as Context)).resolves.toBeUndefined();
});

test('Throws if you do not have item access when primary keys are passed', async () => {
	const accountability = { admin: false } as unknown as Accountability;
	const action = 'read';
	const collection = 'collection-a';

	vi.mocked(validateCollectionAccess).mockResolvedValue(false);

	await expect(validateAccess({ accountability, action, collection }, {} as Context)).rejects.toBeInstanceOf(
		ForbiddenError,
	);
});

test('Throws if you do not have collection access when primary keys are not passed', async () => {
	const accountability = { admin: false } as unknown as Accountability;
	const action = 'read';
	const collection = 'collection-a';

	vi.mocked(validateItemAccess).mockResolvedValue(false);

	await expect(validateAccess({ accountability, action, collection }, {} as Context)).rejects.toBeInstanceOf(
		ForbiddenError,
	);
});
