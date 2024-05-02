import type { Accountability, Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { AccessService } from '../../../../services/access.js';
import type { PermissionsService } from '../../../../services/index.js';
import { fetchPermissions } from '../../../lib/fetch-permissions.js';
import { validateCollectionAccess } from './validate-collection-access.js';

vi.mock('../../../lib/fetch-permissions.js');
vi.mock('../../../lib/fetch-policies.js');

let accessService: AccessService;
let permissionsService: PermissionsService;

beforeEach(() => {
	vi.clearAllMocks();

	accessService = {
		readByQuery: vi.fn().mockResolvedValue([]),
	} as unknown as AccessService;

	permissionsService = {
		readByQuery: vi.fn().mockResolvedValue([]),
	} as unknown as PermissionsService;
});

test('Returns false if permissions is an empty array', async () => {
	vi.mocked(fetchPermissions).mockResolvedValue([]);

	const res = await validateCollectionAccess(
		accessService,
		permissionsService,
		{} as unknown as Accountability,
		'read',
		'collection-a',
	);

	expect(res).toBe(false);
});

test('Returns true if permissions exist', async () => {
	vi.mocked(fetchPermissions).mockResolvedValue([{} as unknown as Permission]);

	const res = await validateCollectionAccess(
		accessService,
		permissionsService,
		{} as unknown as Accountability,
		'read',
		'collection-a',
	);

	expect(res).toBe(true);
});
