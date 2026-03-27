import { useCollection } from '@directus/composables';
import { Field, ItemPermissions, PermissionsAction } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { computed, ref, Ref } from 'vue';
import { getFields } from './get-fields';
import { mockedStore } from '@/__utils__/store';
import type { FormField } from '@/components/v-form/types';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

vi.mock('@directus/composables');

let sample: {
	collection: string;
	fields: Field[];
};

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);

	const collection = 'test_collection';

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
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

const sharedTests = () => {
	it('should return no fields if no collection is given', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref(null) } as any);

		const isNew = false;

		const fetchedItemPermissions = ref();

		const fields = getFields(null, isNew, fetchedItemPermissions);

		expect(fields.value.length).toEqual(0);
	});
};

describe('admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = true;
	});

	sharedTests();

	it('should return all fields', () => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = true;

		vi.mocked(useCollection).mockReturnValue({ fields: ref(sample.fields) } as any);

		const isNew = false;

		const fetchedItemPermissions = ref();

		const fields = getFields(sample.collection, isNew, fetchedItemPermissions);

		expect(fields.value.length).toEqual(sample.fields.length);
	});
});

describe('non-admin users', () => {
	let fetchedItemPermissions: Ref<ItemPermissions>;

	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = false;

		fetchedItemPermissions = ref({} as ItemPermissions);
	});

	sharedTests();

	it('should return all fields with full fields read permission', () => {
		vi.mocked(useCollection).mockReturnValue({ fields: ref(sample.fields), info: ref({}) } as any);

		const mockReadPermission = {
			access: 'full' as const,
			fields: ['*'],
		};

		const permissionsStore = mockedStore(usePermissionsStore());

		permissionsStore.getPermission.mockImplementation((_, action) => {
			if (action === 'read') return mockReadPermission;
			return null;
		});

		const isNew = false;

		const fields = getFields(sample.collection, isNew, fetchedItemPermissions);

		expect(fields.value.length).toEqual(sample.fields.length);
	});

	it('should only return fields with read permissions', () => {
		vi.mocked(useCollection).mockReturnValue({ fields: ref(sample.fields), info: ref({}) } as any);

		const allowedFields = ['id', 'start_date', 'end_date'];

		const mockReadPermission = {
			access: 'full' as const,
			fields: allowedFields,
		};

		const permissionsStore = mockedStore(usePermissionsStore());

		permissionsStore.getPermission.mockImplementation((_, action) => {
			if (action === 'read') return mockReadPermission;
			return null;
		});

		const isNew = false;

		const fields = getFields(sample.collection, isNew, fetchedItemPermissions);

		expect(fields.value.length).toBeGreaterThan(0);

		for (const field of fields.value) {
			expect(allowedFields.includes(field.field)).toBe(true);
		}
	});

	const collectionTypes = ['collection', 'singleton'];

	describe.each(collectionTypes)('%s', (collectionType) => {
		beforeEach(() => {
			vi.mocked(useCollection).mockReturnValue({
				fields: ref(sample.fields),
				info: ref({ meta: { singleton: collectionType === 'singleton' } }),
			} as any);
		});

		const permissionActions: PermissionsAction[] = ['create', 'update'];

		describe.each(permissionActions)('%s', (testAction) => {
			it('should mark all fields as read-only if user has no update/create permission', () => {
				if (collectionType === 'collection') {
					const permissionsStore = mockedStore(usePermissionsStore());

					permissionsStore.getPermission.mockReturnValue(null);
				} else {
					fetchedItemPermissions = computed(() => {
						return {
							update: {
								access: false,
							},
						} as ItemPermissions;
					});
				}

				const isNew = testAction === 'create';

				const fields = getFields(sample.collection, isNew, fetchedItemPermissions);

				expect(fields.value.length).toEqual(sample.fields.length);

				for (const field of fields.value) {
					expect(field.meta?.readonly).toBe(true);
				}
			});

			it('should mark non-allowed fields as read-only', () => {
				const allowedFields = ['id', 'start_date', 'end_date'];

				const mockActionPermission = {
					fields: allowedFields,
				};

				if (collectionType === 'collection') {
					const permissionsStore = mockedStore(usePermissionsStore());

					permissionsStore.getPermission.mockImplementation((_, action) => {
						if (action === testAction) return mockActionPermission;
						return null;
					});
				} else {
					fetchedItemPermissions = computed(() => {
						return {
							update: {
								access: true,
								fields: mockActionPermission.fields,
							},
						} as ItemPermissions;
					});
				}

				const isNew = testAction === 'create';

				const fields = getFields(sample.collection, isNew, fetchedItemPermissions);

				expect(fields.value.length).toEqual(sample.fields.length);

				for (const field of fields.value) {
					const readonly = allowedFields.includes(field.field) ? undefined : true;

					expect(field.meta?.readonly).toBe(readonly);
				}
			});

			it('should not mark any fields as read-only if user has full fields permission', () => {
				const mockActionPermission = {
					fields: ['*'],
				};

				if (collectionType === 'collection') {
					const permissionsStore = mockedStore(usePermissionsStore());

					permissionsStore.getPermission.mockImplementation((_, action) => {
						if (action === testAction) return mockActionPermission;
						return null;
					});
				} else {
					fetchedItemPermissions = computed(() => {
						return {
							update: {
								access: true,
								fields: mockActionPermission.fields,
							},
						} as ItemPermissions;
					});
				}

				const isNew = testAction === 'create';

				const fields = getFields(sample.collection, isNew, fetchedItemPermissions);

				expect(fields.value.length).toEqual(sample.fields.length);

				for (const field of fields.value) {
					expect(!!field.meta?.readonly).toBe(false);
				}
			});

			it('should apply default values from presets', () => {
				const namePreset = 'test_name_preset';

				const mockActionPermission = {
					presets: { name: namePreset } as Record<string, any>,
				};

				if (collectionType === 'collection') {
					const permissionsStore = mockedStore(usePermissionsStore());

					permissionsStore.getPermission.mockImplementation((_, action) => {
						if (action === testAction) return mockActionPermission;
						return null;
					});
				} else {
					fetchedItemPermissions = computed(() => {
						return {
							update: {
								access: true,
								presets: mockActionPermission.presets,
							},
						} as ItemPermissions;
					});
				}

				const isNew = testAction === 'create';

				const fields = getFields(sample.collection, isNew, fetchedItemPermissions);

				const nameField = fields.value.find((field) => field.field === 'name');

				expect(nameField?.schema?.default_value).toEqual(namePreset);
			});
		});
	});

	describe('collection with partial access (custom item rules)', () => {
		beforeEach(() => {
			vi.mocked(useCollection).mockReturnValue({
				fields: ref(sample.fields),
				info: ref({ meta: { singleton: false } }),
			} as any);
		});

		it('should mark all fields as non-editable when item fails custom rule', () => {
			const permissionsStore = mockedStore(usePermissionsStore());

			permissionsStore.getPermission.mockImplementation((_, action) => {
				if (action === 'update') return { access: 'partial', fields: ['id', 'name', 'start_date', 'end_date'] };
				return null;
			});

			fetchedItemPermissions = computed(() => ({
				update: { access: false },
				delete: { access: false },
				share: { access: false },
			}));

			const fields = getFields(sample.collection, false, fetchedItemPermissions);

			for (const field of fields.value) {
				expect(field.meta?.readonly).toBe(true);
				expect((field as FormField).meta?.non_editable).toBe(true);
			}
		});

		it('should not restrict fields when partial access has no field restriction and item passes custom rule', () => {
			const permissionsStore = mockedStore(usePermissionsStore());

			permissionsStore.getPermission.mockImplementation((_, action) => {
				if (action === 'update') return { access: 'partial' }; // no fields property
				return null;
			});

			fetchedItemPermissions = computed(() => ({
				update: { access: true }, // item passes condition
				delete: { access: false },
				share: { access: false },
			}));

			const fields = getFields(sample.collection, false, fetchedItemPermissions);

			for (const field of fields.value) {
				expect(!!field.meta?.readonly).toBe(false);
			}
		});

		it('should use store fields when item passes custom rule', () => {
			const allowedFields = ['id', 'start_date'];

			const permissionsStore = mockedStore(usePermissionsStore());

			permissionsStore.getPermission.mockImplementation((_, action) => {
				if (action === 'update') return { access: 'partial', fields: allowedFields };
				return null;
			});

			fetchedItemPermissions = computed(() => ({
				update: { access: true },
				delete: { access: false },
				share: { access: false },
			}));

			const fields = getFields(sample.collection, false, fetchedItemPermissions);

			for (const field of fields.value) {
				const readonly = allowedFields.includes(field.field) ? undefined : true;
				expect(field.meta?.readonly).toBe(readonly);
			}
		});

		it('should use store permission directly when access is full', () => {
			const permissionsStore = mockedStore(usePermissionsStore());

			permissionsStore.getPermission.mockImplementation((_, action) => {
				if (action === 'update') return { access: 'full', fields: ['*'] };
				return null;
			});

			fetchedItemPermissions = computed(() => ({
				update: { access: false },
				delete: { access: false },
				share: { access: false },
			}));

			const fields = getFields(sample.collection, false, fetchedItemPermissions);

			for (const field of fields.value) {
				expect(!!field.meta?.readonly).toBe(false);
			}
		});

		it('should use store permission for versions even when main item fails custom rule', () => {
			const permissionsStore = mockedStore(usePermissionsStore());

			permissionsStore.getPermission.mockImplementation((_, action) => {
				if (action === 'update') return { access: 'partial', fields: ['*'] };
				return null;
			});

			fetchedItemPermissions = computed(() => ({
				update: { access: false }, // main item fails condition
				delete: { access: false },
				share: { access: false },
			}));

			const fields = getFields(sample.collection, false, fetchedItemPermissions, true);

			for (const field of fields.value) {
				expect(!!field.meta?.readonly).toBe(false);
			}
		});

		it('should not apply store field restrictions for versions regardless of field policy', () => {
			const allowedFields = ['id', 'start_date'];

			const permissionsStore = mockedStore(usePermissionsStore());

			permissionsStore.getPermission.mockImplementation((_, action) => {
				if (action === 'update') return { access: 'partial', fields: allowedFields };
				return null;
			});

			fetchedItemPermissions = computed(() => ({
				update: { access: false }, // main item fails condition
				delete: { access: false },
				share: { access: false },
			}));

			const fields = getFields(sample.collection, false, fetchedItemPermissions, true);

			for (const field of fields.value) {
				expect(!!field.meta?.readonly).toBe(false);
			}
		});

		it('should use store create permission for new items regardless of partial access', () => {
			const permissionsStore = mockedStore(usePermissionsStore());

			permissionsStore.getPermission.mockImplementation((_, action) => {
				if (action === 'create') return { access: 'partial', fields: ['*'] };
				if (action === 'update') return { access: 'partial', fields: ['id'] };
				return null;
			});

			fetchedItemPermissions = computed(() => ({
				update: { access: false },
				delete: { access: false },
				share: { access: false },
			}));

			const fields = getFields(sample.collection, true, fetchedItemPermissions);

			for (const field of fields.value) {
				expect(!!field.meta?.readonly).toBe(false);
			}
		});
	});
});
