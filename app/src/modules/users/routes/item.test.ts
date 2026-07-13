import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, ref } from 'vue';
import UserItem from './item.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

const mocks = vi.hoisted(() => ({
	save: vi.fn(),
	refresh: vi.fn(),
	routerPush: vi.fn(),
	routerReplace: vi.fn(),
}));

vi.mock('@directus/composables', () => ({
	useCollection: () => ({
		info: ref({
			meta: {
				archive_field: null,
				singleton: false,
			},
		}),
	}),
	useShortcut: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-router')>();

	return {
		...actual,
		useRouter: () => ({
			push: mocks.routerPush,
			replace: mocks.routerReplace,
		}),
	};
});

vi.mock('@/auth', () => ({
	logout: vi.fn(),
}));

vi.mock('@/composables/use-collab', () => ({
	useCollab: () => ({
		users: ref([]),
		connected: ref(false),
		collabContext: ref(null),
		collabCollision: ref(undefined),
		update: vi.fn(),
		clearCollidingChanges: vi.fn(),
		discard: vi.fn(),
		focused: ref([]),
		connectionId: ref(null),
	}),
}));

vi.mock('@/composables/use-edits-guard', () => ({
	useEditsGuard: () => ({
		confirmLeave: ref(false),
		leaveTo: ref(null),
	}),
}));

vi.mock('@/composables/use-item', () => ({
	useItem: () => ({
		isNew: computed(() => false),
		edits: ref({ builder_tenant_id: 'tenant-b' }),
		hasEdits: computed(() => true),
		item: ref({ id: 'current-user', role: { id: 'role-a' } }),
		permissions: {
			collectionPermissions: {
				createAllowed: computed(() => true),
				revisionsAllowed: computed(() => false),
			},
			itemPermissions: {
				updateAllowed: computed(() => true),
				deleteAllowed: computed(() => true),
				saveAllowed: computed(() => true),
				archiveAllowed: computed(() => false),
				fields: ref([]),
			},
		},
		saving: ref(false),
		loading: computed(() => false),
		save: mocks.save,
		remove: vi.fn(),
		deleting: ref(false),
		saveAsCopy: vi.fn(),
		archive: vi.fn(),
		archiving: ref(false),
		isArchived: computed(() => false),
		validationErrors: ref([]),
		refresh: mocks.refresh,
		getItem: vi.fn(),
	}),
}));

function mountUserItem() {
	const pinia = createTestingPinia({
		createSpy: vi.fn,
		initialState: {
			userStore: {
				currentUser: { id: 'current-user' },
			},
		},
	});

	const global: GlobalMountOptions = {
		plugins: [i18n, pinia],
		directives: {
			tooltip: () => {},
		},
		stubs: {
			CollabIndicatorHeader: true,
			CommentsSidebarDetail: true,
			ComparisonModal: true,
			EntitlementLimitModal: true,
			PrivateView: {
				template:
					'<div><slot name="actions" /><slot name="actions:primary" /><slot name="navigation" /><slot /><slot name="sidebar" /></div>',
			},
			PrivateViewHeaderBarActionButton: {
				template: '<button class="primary-action" @click="$emit(\'click\')"><slot name="split-menu" /></button>',
			},
			RevisionsSidebarDetail: true,
			SaveOptions: {
				template: '<button class="save-and-stay" @click.stop="$emit(\'save-and-stay\')" />',
			},
			UserInfoSidebarDetail: true,
			UsersNavigation: true,
			VButton: true,
			VCard: true,
			VCardActions: true,
			VCardText: true,
			VCardTitle: true,
			VChip: true,
			VDialog: true,
			VForm: true,
			VIcon: true,
			VImage: true,
			VSkeletonLoader: true,
		},
	};

	return mount(UserItem, {
		props: {
			primaryKey: 'current-user',
		},
		global,
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.save.mockResolvedValue({ id: 'current-user', builder_tenant_id: 'tenant-b' });
});

describe('users item route', () => {
	test('refreshes permissions after saving the current user', async () => {
		const wrapper = mountUserItem();
		const userStore = useUserStore();
		const permissionsStore = usePermissionsStore();

		await wrapper.find('.save-and-stay').trigger('click');

		expect(mocks.save).toHaveBeenCalledOnce();
		expect(userStore.hydrate).toHaveBeenCalledOnce();
		expect(permissionsStore.hydrate).toHaveBeenCalledOnce();
	});
});
