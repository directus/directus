import { validateCollectionAccess } from './lib/validate-collection-access.js';
import { validateItemAccess } from './lib/validate-item-access.js';
import { validateAccess } from './validate-access.js';
import { AccessService } from '../../../services/access.js';
import { PermissionsService } from '../../../services/index.js';
import type { Context } from '../../types.js';
import { ForbiddenError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('./lib/validate-item-access.js');
vi.mock('./lib/validate-collection-access.js');

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../../services/access.js', () => ({
	AccessService: vi.fn(),
}));

const sample = {
	collection: 'collection-a',
	context: {
		schema: { collections: { ['collection-a']: {} } },
	} as unknown as Context,
};

beforeEach(() => {
	vi.clearAllMocks();

	AccessService.prototype.readByQuery = vi.fn().mockResolvedValue([]);
	PermissionsService.prototype.readByQuery = vi.fn().mockResolvedValue([]);
});

test('Throws if the collection does not exist', async () => {
	const accountability = { admin: false } as unknown as Accountability;
	const action = 'read';

	vi.mocked(validateCollectionAccess).mockResolvedValue(false);

	await expect(
		validateAccess({ accountability, action, collection: 'non-existent' }, sample.context),
	).rejects.toBeInstanceOf(ForbiddenError);
});

test('Does not throw when collection exists check is skipped for admins', async () => {
	const accountability = { admin: true } as unknown as Accountability;
	const action = 'read';

	await expect(
		validateAccess(
			{ accountability, action, collection: 'non-existent', skipCollectionExistsCheck: true },
			sample.context,
		),
	).resolves.toBeUndefined();
});

test('Returns when admin is true', async () => {
	const accountability = { admin: true } as unknown as Accountability;
	const action = 'read';

	await expect(
		validateAccess({ accountability, action, collection: sample.collection }, sample.context),
	).resolves.toBeUndefined();
});

test('Throws if you do not have item access when primary keys are passed', async () => {
	const accountability = { admin: false } as unknown as Accountability;
	const action = 'read';

	vi.mocked(validateCollectionAccess).mockResolvedValue(false);

	await expect(
		validateAccess({ accountability, action, collection: sample.collection }, sample.context),
	).rejects.toBeInstanceOf(ForbiddenError);
});

test('Throws if you do not have collection access when primary keys are not passed', async () => {
	const accountability = { admin: false } as unknown as Accountability;
	const action = 'read';

	vi.mocked(validateItemAccess).mockResolvedValue(false);

	await expect(
		validateAccess({ accountability, action, collection: sample.collection }, sample.context),
	).rejects.toBeInstanceOf(ForbiddenError);
});
