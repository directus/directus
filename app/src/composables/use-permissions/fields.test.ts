import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { randomIdentifier, randomUUID } from '@directus/random';
import { Field, Permission, PermissionsAction, User } from '@directus/types';
import { useFieldsPermissions } from './fields';

vi.mock('@directus/composables');

let sample: {
	collection: string;
	fields: Field[];
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

	const collection = randomIdentifier();

	sample = {
		collection,
		fields: [
			{
				collection,
				field: 'id',
				name: 'id',
				type: 'integer',
				schema: null,
				meta: null,
			},
			{
				collection,
				field: 'name',
				name: 'name',
				type: 'string',
				schema: null,
				meta: null,
			},
			{
				collection,
				field: 'start_date',
				name: 'start_date',
				type: 'timestamp',
				schema: null,
				meta: null,
			},
			{
				collection,
				field: 'end_date',
				name: 'end_date',
				type: 'timestamp',
				schema: null,
				meta: null,
			},
		],
		user: { id: randomUUID() },
		role: { id: randomUUID() },
	};

	vi.mocked(useCollection).mockReturnValue({ fields: ref(sample.fields) } as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('admin users', () => {
	it('should return all fields', () => {
		const mockUser = {
			id: sample.user.id,
			role: {
				id: sample.role.id,
				admin_access: true,
			},
		} as User;

		const userStore = useUserStore();
		userStore.currentUser = mockUser;

		const isNew = false;

		const { fields } = useFieldsPermissions(sample.collection, isNew);

		expect(fields.value.length).toEqual(sample.fields.length);
	});
});

describe('non-admin users', () => {
	it('should return all fields with "*" permission', () => {
		const mockUser = {
			id: sample.user.id,
			role: {
				id: sample.role.id,
				admin_access: false,
			},
		} as User;

		const userStore = useUserStore();
		userStore.currentUser = mockUser;

		const mockPermissions: [Permission] = [
			{
				role: sample.role.id,
				collection: sample.collection,
				action: 'read',
				permissions: null,
				validation: null,
				presets: null,
				fields: ['*'],
			},
		];

		const permissionsStore = usePermissionsStore();
		permissionsStore.permissions = mockPermissions;

		const isNew = false;

		const { fields } = useFieldsPermissions(sample.collection, isNew);

		expect(fields.value.length).toEqual(sample.fields.length);
	});

	it('should only return fields with read permissions', () => {
		const mockUser = {
			id: sample.user.id,
			role: {
				id: sample.role.id,
				admin_access: false,
			},
		} as User;

		const userStore = useUserStore();
		userStore.currentUser = mockUser;

		const allowedFields = ['id', 'start_date', 'end_date'];

		const mockPermissions: Permission[] = [
			{
				role: sample.role.id,
				collection: sample.collection,
				action: 'read',
				permissions: null,
				validation: null,
				presets: null,
				fields: allowedFields,
			},
		];

		const permissionsStore = usePermissionsStore();
		permissionsStore.permissions = mockPermissions;

		const isNew = false;

		const { fields } = useFieldsPermissions(sample.collection, isNew);

		expect(fields.value.length).toBeGreaterThan(0);

		for (const field of fields.value) {
			expect(allowedFields.includes(field.field)).toBe(true);
		}
	});

	const permissionActions: PermissionsAction[] = ['create', 'update'];

	describe.each(permissionActions)('"%s" action', (action) => {
		it('should mark fields as read-only', () => {
			const mockUser = {
				id: sample.user.id,
				role: {
					id: sample.role.id,
					admin_access: false,
				},
			} as User;

			const userStore = useUserStore();
			userStore.currentUser = mockUser;

			const allowedFields = ['id', 'start_date', 'end_date'];

			const mockPermissions: Permission[] = [
				{
					role: sample.role.id,
					collection: sample.collection,
					action: 'read',
					permissions: null,
					validation: null,
					presets: null,
					fields: ['*'],
				},
				{
					role: sample.role.id,
					collection: sample.collection,
					action,
					permissions: null,
					validation: null,
					presets: null,
					fields: allowedFields,
				},
			];

			const permissionsStore = usePermissionsStore();
			permissionsStore.permissions = mockPermissions;

			const isNew = action === 'create';

			const { fields } = useFieldsPermissions(sample.collection, isNew);

			expect(fields.value.length).toEqual(sample.fields.length);

			for (const field of fields.value) {
				const readonly = allowedFields.includes(field.field) ? undefined : true;

				expect(field.meta?.readonly).toBe(readonly);
			}
		});

		it('should apply default values from presets', () => {
			const mockUser = {
				id: sample.user.id,
				role: {
					id: sample.role.id,
					admin_access: false,
				},
			} as User;

			const userStore = useUserStore();
			userStore.currentUser = mockUser;

			const namePreset = randomIdentifier();

			const mockPermissions: Permission[] = [
				{
					role: sample.role.id,
					collection: sample.collection,
					action: 'read',
					permissions: null,
					validation: null,
					presets: null,
					fields: ['*'],
				},
				{
					role: sample.role.id,
					collection: sample.collection,
					action,
					permissions: null,
					validation: null,
					presets: { name: namePreset },
					fields: ['*'],
				},
			];

			const permissionsStore = usePermissionsStore();
			permissionsStore.permissions = mockPermissions;

			const isNew = action === 'create';

			const { fields } = useFieldsPermissions(sample.collection, isNew);

			const nameField = fields.value.find((field) => field.field === 'name');

			expect(nameField?.schema?.default_value).toEqual(namePreset);
		});
	});
});
