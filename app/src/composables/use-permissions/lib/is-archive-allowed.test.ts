import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ref } from 'vue';

import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { randomIdentifier, randomUUID } from '@directus/random';
import { Permission, User } from '@directus/types';
import { isArchiveAllowed } from './is-archive-allowed';

vi.mock('@directus/composables');

let sample: {
	user: { id: string };
	role: { id: string };
};

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	sample = {
		user: { id: randomUUID() },
		role: { id: randomUUID() },
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

const collection = randomIdentifier();
const archiveField = randomIdentifier();

const permissions = {
	all: {
		fields: ['*'],
	},
	field: {
		fields: [archiveField],
	},
	none: {
		fields: [],
	},
};

const cases: [
	string,
	{
		admin: boolean;
		permission: Pick<Permission, 'fields'> | null;
		updateAllowed: boolean;
		archiveField: string | null;
		expected: boolean;
	},
][] = [
	[
		'disallowed for admin user when collection has no archive field',
		{ admin: true, permission: null, updateAllowed: true, archiveField: null, expected: false },
	],
	[
		'disallowed for non-admin user when collection has no archive field',
		{ admin: false, permission: permissions.all, updateAllowed: true, archiveField: null, expected: false },
	],
	['allowed for admin user', { admin: true, permission: null, updateAllowed: true, archiveField, expected: true }],
	[
		'allowed for non-admin user with all field permission',
		{ admin: false, permission: permissions.all, updateAllowed: true, archiveField, expected: true },
	],
	[
		'disallowed for non-admin user with no item-based update permission',
		{ admin: false, permission: permissions.all, updateAllowed: false, archiveField, expected: false },
	],
	[
		'allowed for non-admin user with field permission',
		{ admin: false, permission: permissions.field, updateAllowed: true, archiveField, expected: true },
	],
	[
		'disallowed for non-admin user with no field permission',
		{ admin: false, permission: permissions.none, updateAllowed: true, archiveField, expected: false },
	],
	[
		'disallowed for non-admin user with no permission',
		{ admin: false, permission: null, updateAllowed: true, archiveField, expected: false },
	],
];

test.each(cases)('%s', (_, { admin, permission, archiveField, updateAllowed, expected }) => {
	vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { archive_field: archiveField } }) } as any);

	const mockUser = {
		id: sample.user.id,
		role: {
			id: sample.role.id,
			admin_access: admin,
		},
	} as User;

	const userStore = useUserStore();
	userStore.currentUser = mockUser;

	const permissionsStore = usePermissionsStore();

	permissionsStore.permissions = permission
		? [
				{
					role: sample.role.id,
					collection,
					action: 'update',
					permissions: null,
					validation: null,
					presets: null,
					...permission,
				},
		  ]
		: [];

	const result = isArchiveAllowed(collection, ref(updateAllowed));

	expect(result.value).toBe(expected);
});
