import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VersionMenu from './version-menu.vue';
import { Tooltip } from '@/__utils__/tooltip';
import { i18n } from '@/lang';
import type { ContentVersionMaybeNew, ContentVersionWithType, NewContentVersion } from '@/types/versions';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock('@/composables/use-permissions', () => ({
	useCollectionPermissions: vi.fn(() => ({
		createAllowed: { value: true },
		readAllowed: { value: true },
		updateAllowed: { value: true },
		deleteAllowed: { value: true },
	})),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

afterEach(() => {
	vi.clearAllMocks();
});

function createMockVersion(overrides: Partial<ContentVersionWithType>): ContentVersionWithType {
	return {
		id: 'version-id',
		key: 'version-key',
		name: 'Version Name',
		collection: 'test_collection',
		item: '1',
		hash: 'abc123',
		date_created: '2024-01-01',
		date_updated: '2024-01-02',
		user_created: 'user-1',
		user_updated: 'user-1',
		delta: null,
		type: 'local',
		...overrides,
	};
}

function createNewVersion(overrides: Partial<NewContentVersion> = {}): NewContentVersion {
	return {
		id: '+',
		key: 'draft',
		name: null,
		type: 'global',
		...overrides,
	};
}

const baseProps = {
	collection: 'test_collection',
	primaryKey: '1',
	updateAllowed: true,
	hasEdits: false,
	currentVersion: null as ContentVersionMaybeNew | null,
	versions: [] as ContentVersionMaybeNew[],
};

const mountOptions = {
	global: {
		plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
		directives: {
			tooltip: Tooltip,
		},
		stubs: {
			VMenu: {
				template: '<div class="v-menu"><slot name="activator" :toggle="() => {}" /><slot /></div>',
			},
			VList: { template: '<div class="v-list"><slot /></div>' },
			VListItem: {
				template: '<div class="v-list-item" :class="{ active, disabled }" @click="$emit(\'click\')"><slot /></div>',
				props: ['clickable', 'active', 'disabled'],
			},
			VListItemContent: { template: '<div class="v-list-item-content"><slot /></div>' },
			VDivider: { template: '<hr class="v-divider" />' },
			VIcon: { template: '<span class="v-icon" :data-name="$attrs.name"></span>' },
			VTextOverflow: { template: '<span class="v-text-overflow">{{ $attrs.text }}</span>' },
			VDialog: { template: '<div class="v-dialog" v-if="modelValue"><slot /></div>', props: ['modelValue'] },
			VCard: { template: '<div class="v-card"><slot /></div>' },
			VCardTitle: { template: '<div class="v-card-title"><slot /></div>' },
			VCardText: { template: '<div class="v-card-text"><slot /></div>' },
			VCardActions: { template: '<div class="v-card-actions"><slot /></div>' },
			VButton: { template: '<button class="v-button" :disabled="$attrs.disabled"><slot /></button>' },
			VInput: { template: '<input class="v-input" />' },
			ComparisonModal: { template: '<div class="comparison-modal"></div>' },
		},
	},
	props: baseProps,
};

describe('VersionMenu', () => {
	describe('version list rendering', () => {
		it('should always show the global draft version in the menu', () => {
			const draftVersion = createNewVersion({ key: 'draft', type: 'global' });

			const wrapper = mount(VersionMenu, {
				...mountOptions,
				props: {
					...baseProps,
					versions: [draftVersion],
				},
			});

			expect(wrapper.text()).toContain(i18n.global.t('draft'));
		});

		it('should show edit dot for versions with content changes in it', () => {
			const versionWithEdits = createMockVersion({
				key: 'edited-version',
				type: 'local',
				delta: { title: 'changed' },
			});

			const wrapper = mount(VersionMenu, {
				...mountOptions,
				props: {
					...baseProps,
					versions: [versionWithEdits],
					currentVersion: null,
				},
			});

			expect(wrapper.find('.edit-dot').exists()).toBe(true);
		});

		it('should not show edit dot for versions without content changes', () => {
			const versionWithoutEdits = createMockVersion({
				key: 'clean-version',
				type: 'local',
				delta: null,
			});

			const wrapper = mount(VersionMenu, {
				...mountOptions,
				props: {
					...baseProps,
					versions: [versionWithoutEdits],
					currentVersion: null,
				},
			});

			expect(wrapper.find('.edit-dot').exists()).toBe(false);
		});
	});

	describe('global version behavior', () => {
		it('should show discard changes option instead of delete version for global versions', () => {
			const globalVersion = createMockVersion({ id: 'global-id', key: 'draft', type: 'global' });

			const wrapper = mount(VersionMenu, {
				...mountOptions,
				props: {
					...baseProps,
					versions: [globalVersion],
					currentVersion: globalVersion,
				},
			});

			expect(wrapper.text()).toContain(i18n.global.t('discard_changes'));
			expect(wrapper.text()).not.toContain(i18n.global.t('delete_version'));
		});

		it('should show delete version option for local versions', () => {
			const localVersion = createMockVersion({ id: 'local-id', key: 'my-version', type: 'local' });

			const wrapper = mount(VersionMenu, {
				...mountOptions,
				props: {
					...baseProps,
					versions: [localVersion],
					currentVersion: localVersion,
				},
			});

			expect(wrapper.text()).toContain(i18n.global.t('delete_version'));
			expect(wrapper.text()).not.toContain(i18n.global.t('discard_changes'));
		});

		it('should not show rename option for global versions', () => {
			const globalVersion = createMockVersion({ id: 'global-id', key: 'draft', type: 'global' });

			const wrapper = mount(VersionMenu, {
				...mountOptions,
				props: {
					...baseProps,
					versions: [globalVersion],
					currentVersion: globalVersion,
				},
			});

			expect(wrapper.text()).not.toContain(i18n.global.t('rename_version'));
		});

		it('should show rename option for local versions', () => {
			const localVersion = createMockVersion({ id: 'local-id', key: 'my-version', type: 'local' });

			const wrapper = mount(VersionMenu, {
				...mountOptions,
				props: {
					...baseProps,
					versions: [localVersion],
					currentVersion: localVersion,
				},
			});

			expect(wrapper.text()).toContain(i18n.global.t('rename_version'));
		});
	});

	describe('reserved version key', () => {
		const draftGlobalVersion = createMockVersion({ id: 'draft-id', key: 'draft', type: 'global' });

		const interactiveMountOptions = {
			...mountOptions,
			global: {
				...mountOptions.global,
				stubs: {
					...mountOptions.global.stubs,
					VInput: {
						props: ['modelValue'],
						emits: ['update:modelValue'],
						template: `<input class="v-input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
					},
				},
			},
		};

		it('should disable create save button when version key matches a global version key', async () => {
			const wrapper = mount(VersionMenu, {
				...interactiveMountOptions,
				props: {
					...baseProps,
					versions: [draftGlobalVersion],
				},
			});

			const createItem = wrapper
				.findAll('.v-list-item')
				.find((item) => item.text().includes(i18n.global.t('create_version')));

			await createItem!.trigger('click');

			const dialog = wrapper.find('.v-dialog');
			const inputs = dialog.findAll('input.v-input');
			await inputs[1]!.setValue('draft');

			const saveButton = dialog.findAll('.v-button').find((btn) => btn.text().includes(i18n.global.t('save')));

			expect(saveButton!.attributes('disabled')).toBeDefined();
		});

		it('should disable rename save button when version key is changed to a global version key', async () => {
			const localVersion = createMockVersion({
				id: 'local-id',
				key: 'my-version',
				name: 'My Version',
				type: 'local',
			});

			const wrapper = mount(VersionMenu, {
				...interactiveMountOptions,
				props: {
					...baseProps,
					versions: [draftGlobalVersion, localVersion],
					currentVersion: localVersion,
				},
			});

			const renameItem = wrapper
				.findAll('.v-list-item')
				.find((item) => item.text().includes(i18n.global.t('rename_version')));

			await renameItem!.trigger('click');

			const dialog = wrapper.find('.v-dialog');
			const inputs = dialog.findAll('input.v-input');
			await inputs[1]!.setValue('draft');

			const saveButton = dialog.findAll('.v-button').find((btn) => btn.text().includes(i18n.global.t('save')));

			expect(saveButton!.attributes('disabled')).toBeDefined();
		});
	});

	describe('new version behavior', () => {
		it('should disable promote and discard for new (virtual) versions', () => {
			const newVersion = createNewVersion({ key: 'draft', type: 'global' });

			const wrapper = mount(VersionMenu, {
				...mountOptions,
				props: {
					...baseProps,
					versions: [newVersion],
					currentVersion: newVersion,
				},
			});

			const listItems = wrapper.findAll('.v-list-item');
			const promoteItem = listItems.find((item) => item.text().includes(i18n.global.t('promote_version')));
			const deleteItem = listItems.find((item) => item.text().includes(i18n.global.t('discard_changes')));

			expect(promoteItem?.classes()).toContain('disabled');
			expect(deleteItem?.classes()).toContain('disabled');
		});
	});
});
