import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import OverlayItem from './overlay-item.vue';
import { ClickOutside } from '@/__utils__/click-outside';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const mockCollabConnected = ref<boolean | undefined>(false);
const mockSaveAllowed = ref(true);

vi.mock('@/composables/use-permissions', () => ({
	usePermissions: () => ({
		collectionPermissions: {},
		itemPermissions: {
			fields: computed(() => []),
			saveAllowed: computed(() => mockSaveAllowed.value),
		},
	}),
}));

vi.mock('@/composables/use-collab', () => ({
	useCollab: () => ({
		connected: mockCollabConnected,
		users: ref([]),
		focused: ref({}),
		connectionId: ref(null),
		collabCollision: ref(undefined),
		collabContext: { focusedFields: [] },
		update: vi.fn(),
		clearCollidingChanges: vi.fn(),
	}),
}));

vi.mock('@directus/composables', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/composables')>()),
	useCollection: () => ({
		info: computed(() => ({ name: 'Articles', collection: 'articles', meta: null })),
		primaryKeyField: computed(() => ({ field: 'id' })),
		fields: computed(() => []),
	}),
	useGroupable: () => ({ active: ref(false), toggle: vi.fn() }),
	useSizeClass: () => computed(() => ''),
	useShortcut: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => ({
	...(await importOriginal<typeof import('vue-router')>()),
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/composables/use-edits-guard', () => ({
	useEditsGuard: () => ({ confirmLeave: ref(false), leaveTo: ref(null) }),
}));

vi.mock('@/api', () => ({
	default: { get: vi.fn() },
	RequestError: class RequestError extends Error {},
}));

let global: GlobalMountOptions;

const globalStubs: GlobalMountOptions = {
	directives: {
		tooltip: Tooltip,
		'click-outside': ClickOutside,
	},
	stubs: {
		VDialog: { template: '<div><slot /></div>' },
		VDrawer: { template: '<div><slot /></div>' },
		VMenu: { template: '<div><slot /></div>' },
		VCard: { template: '<div><slot /></div>' },
		VCardTitle: { template: '<div><slot /></div>' },
		VCardText: { template: '<div><slot /></div>' },
		VCardActions: { template: '<div><slot /></div>' },
		VButton: { template: '<button><slot /></button>' },
		VIcon: true,
		VBreadcrumb: true,
		VSkeletonLoader: true,
		OverlayItemContent: true,
		CollabIndicatorHeader: true,
		ComparisonModal: { template: '<div />' },
		FlowDialogs: true,
		RenderTemplate: true,
		PrivateViewHeaderBarActionButton: true,
	},
};

beforeEach(() => {
	global = { ...globalStubs, plugins: [i18n, createTestingPinia({ createSpy: vi.fn })] };
});

afterEach(() => {
	mockCollabConnected.value = false;
	mockSaveAllowed.value = true;
	vi.clearAllMocks();
});

describe('unsaved-changes dialog', () => {
	it('shows standard dialog when collab is not connected', () => {
		const wrapper = mount(OverlayItem, {
			props: {
				collection: 'articles',
				active: true,
				primaryKey: '+',
			},
			global,
		});

		expect(wrapper.text()).toContain(i18n.global.t('unsaved_changes'));
		expect(wrapper.text()).not.toContain(i18n.global.t('unsaved_changes_collab'));
	});

	it('shows collab dialog when collab is connected', () => {
		mockCollabConnected.value = true;

		const wrapper = mount(OverlayItem, {
			props: {
				collection: 'articles',
				active: true,
				primaryKey: '+',
			},
			global,
		});

		expect(wrapper.text()).toContain(i18n.global.t('unsaved_changes_collab'));
		expect(wrapper.text()).not.toContain(i18n.global.t('unsaved_changes'));
	});
});

describe('isSavable', () => {
	function mountWithActionSlot(props: Record<string, any>) {
		return mount(OverlayItem, {
			props: {
				collection: 'articles',
				overlay: 'drawer',
				...props,
			},
			global: {
				...global,
				stubs: {
					...globalStubs.stubs,
					VDrawer: { template: '<div><slot /><slot name="actions" /></div>' },
				},
			},
		});
	}

	function getSaveButton(wrapper: ReturnType<typeof mount>) {
		return wrapper.find('private-view-header-bar-action-button-stub');
	}

	it('enables save button for a new item without edits', () => {
		const wrapper = mountWithActionSlot({
			active: true,
			primaryKey: '+',
		});

		const saveButton = getSaveButton(wrapper);
		expect(saveButton.attributes('disabled')).toBe('false');
	});

	it('disables save button for an existing item without edits', () => {
		const wrapper = mountWithActionSlot({
			active: true,
			primaryKey: '1',
		});

		const saveButton = getSaveButton(wrapper);
		expect(saveButton.attributes('disabled')).toBe('true');
	});

	it('enables save button for an existing item with edits', () => {
		const wrapper = mountWithActionSlot({
			active: true,
			primaryKey: '1',
			edits: { title: 'updated' },
		});

		const saveButton = getSaveButton(wrapper);
		expect(saveButton.attributes('disabled')).toBe('false');
	});

	it('disables save button when disabled prop is true even for new items', () => {
		const wrapper = mountWithActionSlot({
			active: true,
			primaryKey: '+',
			disabled: true,
		});

		const saveButton = getSaveButton(wrapper);
		expect(saveButton.attributes('disabled')).toBe('true');
	});

	it('disables save button when save is not allowed by permissions', () => {
		mockSaveAllowed.value = false;

		const wrapper = mountWithActionSlot({
			active: true,
			primaryKey: '+',
		});

		const saveButton = getSaveButton(wrapper);
		expect(saveButton.attributes('disabled')).toBe('true');
	});
});
