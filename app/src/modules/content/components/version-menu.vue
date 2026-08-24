<script setup lang="ts">
import { VERSION_KEY_DRAFT } from '@directus/constants';
import type { ContentVersion, PrimaryKey } from '@directus/types';
import slugify from '@sindresorhus/slugify';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VersionChip from './version-chip.vue';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import type { ContentVersionMaybeNew } from '@/types/versions';
import { getVersionDisplayName } from '@/utils/get-version-display-name';
import { unexpectedError } from '@/utils/unexpected-error';

interface Props {
	collection: string;
	primaryKey: PrimaryKey | null;
	hasEdits: boolean;
	currentVersion: ContentVersionMaybeNew | null;
	versions: ContentVersionMaybeNew[];
	deleteVersionLoading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	add: [version: ContentVersion];
	update: [updates: { key: string; name?: string | null }];
	delete: [versionId: PrimaryKey];
	switch: [version: ContentVersionMaybeNew | null];
}>();

const { collection, primaryKey, hasEdits, currentVersion, versions, deleteVersionLoading } = toRefs(props);

const { t } = useI18n();

const draftVersion = computed(() => versions.value.find((version) => version.key === VERSION_KEY_DRAFT));
const localVersions = computed(() => versions.value.filter((version) => version.type === 'local'));

const {
	createAllowed: createVersionsAllowed,
	readAllowed: readVersionsAllowed,
	updateAllowed: updateVersionsAllowed,
	deleteAllowed: deleteVersionsAllowed,
} = useCollectionPermissions('directus_versions');

const { switchDialogActive, switchTarget, switchVersion } = useSwitchDialog();

const {
	createDialogActive,
	newVersionKey,
	newVersionName,
	closeCreateDialog,
	creating,
	isCreateDisabled,
	createVersion,
} = useCreateDialog();

const { renameDialogActive, openRenameDialog, closeRenameDialog, updating, renameVersion, isRenameDisabled } =
	useRenameDialog();

const { deleteDialogActive, onDeleteVersion } = useDeleteDialog();

const { isCurrentVersionGlobal, isCurrentVersionNew, canAccessGlobalVersion, isVersionKeyGlobal, isVersionNew } =
	useGlobalVersions();

const isNewItem = computed(() => primaryKey.value === '+');

const newVersionKeyReservedTooltip = computed(() =>
	isVersionKeyGlobal(newVersionKey.value) ? t('reserved_version_key', { key: newVersionKey.value }) : undefined,
);

function useSwitchDialog() {
	const switchDialogActive = ref(false);
	const switchTarget = ref<ContentVersionMaybeNew | null>(null);

	return {
		switchDialogActive,
		switchTarget,
		switchVersion,
	};

	function switchVersion(version?: ContentVersionMaybeNew | null) {
		if (version !== undefined) switchTarget.value = version;

		if (hasEdits.value && !switchDialogActive.value) {
			switchDialogActive.value = true;
		} else {
			switchDialogActive.value = false;
			emit('switch', switchTarget.value);
		}
	}
}

function useCreateDialog() {
	const createDialogActive = ref(false);
	const creating = ref(false);
	const newVersionKey = ref<string | null>(null);
	const newVersionName = ref<string | null>(null);
	const isCreateDisabled = computed(() => newVersionKey.value === null || isVersionKeyGlobal(newVersionKey.value));

	watch(
		newVersionName,
		(newName, oldName) => {
			if (
				newName === null ||
				newVersionKey.value ===
					slugify(oldName ?? '', {
						separator: '-',
					})
			) {
				newVersionKey.value = slugify(newName ?? '', {
					separator: '-',
				});
			}
		},
		{ immediate: true },
	);

	return {
		newVersionKey,
		newVersionName,
		createDialogActive,
		creating,
		isCreateDisabled,
		createVersion,
		closeCreateDialog,
	};

	async function createVersion() {
		if (isCreateDisabled.value || creating.value || !newVersionKey.value) return;

		if (!unref(primaryKey) || unref(primaryKey) === '+') return;

		creating.value = true;

		try {
			const {
				data: { data: version },
			} = await api.post(`/versions`, {
				key: newVersionKey.value,
				name: isVersionKeyGlobal(newVersionKey.value) ? null : (newVersionName.value ?? null),
				collection: collection.value,
				item: String(primaryKey.value),
			});

			emit('add', version);

			closeCreateDialog();
		} catch (error) {
			unexpectedError(error);
		} finally {
			creating.value = false;
		}
	}

	function closeCreateDialog() {
		createDialogActive.value = false;
		newVersionKey.value = null;
		newVersionName.value = null;
	}
}

function useRenameDialog() {
	const renameDialogActive = ref(false);
	const updating = ref(false);

	const isRenameDisabled = computed(
		() =>
			((newVersionKey.value === null || newVersionKey.value === currentVersion.value?.key) &&
				newVersionName.value === currentVersion.value?.name) ||
			isVersionKeyGlobal(newVersionKey.value) ||
			!unref(primaryKey) ||
			unref(primaryKey) === '+' ||
			!newVersionKey.value ||
			isCurrentVersionGlobal.value,
	);

	return {
		renameDialogActive,
		updating,
		isRenameDisabled,
		renameVersion,
		openRenameDialog,
		closeRenameDialog,
	};

	async function renameVersion() {
		if (isRenameDisabled.value || updating.value || newVersionKey.value === null || !currentVersion.value?.id) return;

		updating.value = true;

		try {
			const updates = {
				key: newVersionKey.value,
				name: isVersionKeyGlobal(newVersionKey.value) ? null : newVersionName.value,
			};

			await api.patch(`/versions/${currentVersion.value.id}`, updates);

			emit('update', updates);

			closeRenameDialog();
		} catch (error) {
			unexpectedError(error);
		} finally {
			updating.value = false;
		}
	}

	function openRenameDialog() {
		if (!currentVersion.value) return;
		newVersionKey.value = currentVersion.value.key;
		newVersionName.value = currentVersion.value.name;
		renameDialogActive.value = true;
	}

	function closeRenameDialog() {
		renameDialogActive.value = false;
		newVersionKey.value = null;
		newVersionName.value = null;
	}
}

function useDeleteDialog() {
	const deleteDialogActive = ref(false);

	return { deleteDialogActive, onDeleteVersion };

	async function onDeleteVersion() {
		const versionId = currentVersion.value?.id;
		if (!versionId || deleteVersionLoading.value) return;

		emit('delete', versionId);
		deleteDialogActive.value = false;
	}
}

function useGlobalVersions() {
	const isCurrentVersionGlobal = computed(() => currentVersion.value?.type === 'global');
	const isCurrentVersionNew = computed(() => isVersionNew(currentVersion.value));

	return {
		isCurrentVersionGlobal,
		isCurrentVersionNew,
		canAccessGlobalVersion,
		isVersionKeyGlobal,
		isVersionNew,
	};

	function canAccessGlobalVersion(version: ContentVersionMaybeNew | null): boolean {
		return isVersionNew(version) ? createVersionsAllowed.value : readVersionsAllowed.value;
	}

	function isVersionKeyGlobal(key: ContentVersion['key'] | null) {
		return key !== null && versions.value.find((version) => version.key === key)?.type === 'global';
	}

	function isVersionNew(version: ContentVersionMaybeNew | null) {
		return version?.id === '+';
	}
}

function hasVersionEdits(version: ContentVersionMaybeNew | null) {
	if (!version || isVersionNew(version)) return false;
	return (version as ContentVersion).delta !== null;
}
</script>

<template>
	<VMenu class="version-menu" placement="bottom" show-arrow :disabled="!readVersionsAllowed">
		<template #activator="{ toggle }">
			<VersionChip :version="currentVersion" :clickable="readVersionsAllowed" @click="toggle()" />
		</template>

		<VList class="version-list">
			<VListItem
				class="version-item"
				clickable
				:active="currentVersion === null"
				:disabled="isNewItem"
				@click="switchVersion(null)"
			>
				<VListItemIcon class="version-item-icon">
					<span v-if="!isNewItem" v-tooltip="$t('content_edited')" class="edit-dot edit-dot-primary" />
				</VListItemIcon>

				<VListItemContent>
					{{ $t('published') }}
				</VListItemContent>
			</VListItem>

			<VListItem
				v-if="draftVersion"
				class="version-item"
				clickable
				:active="draftVersion?.key === currentVersion?.key"
				:disabled="!canAccessGlobalVersion(draftVersion)"
				@click="switchVersion(draftVersion)"
			>
				<VListItemIcon class="version-item-icon">
					<span
						v-if="hasVersionEdits(draftVersion)"
						v-tooltip="$t('content_edited')"
						class="edit-dot edit-dot-secondary"
					/>
				</VListItemIcon>

				<VListItemContent>
					<VTextOverflow :text="getVersionDisplayName(draftVersion)" />
				</VListItemContent>
			</VListItem>

			<VListItem
				v-for="versionItem of localVersions"
				:key="versionItem.id"
				class="version-item"
				clickable
				:active="versionItem.id === currentVersion?.id"
				@click="switchVersion(versionItem)"
			>
				<VListItemIcon class="version-item-icon">
					<span v-if="hasVersionEdits(versionItem)" v-tooltip="$t('content_edited')" class="edit-dot" />
				</VListItemIcon>

				<VListItemContent>
					<VTextOverflow :text="getVersionDisplayName(versionItem)" />
				</VListItemContent>
			</VListItem>

			<template v-if="createVersionsAllowed">
				<VDivider />

				<VListItem
					v-tooltip="isNewItem ? $t('version_create_item_less') : undefined"
					:disabled="isNewItem"
					clickable
					@click="createDialogActive = true"
				>
					<VListItemIcon>
						<VIcon name="add" />
					</VListItemIcon>

					<VListItemContent>{{ $t('create_version') }}</VListItemContent>
				</VListItem>
			</template>

			<template v-if="currentVersion !== null">
				<VDivider />

				<VListItem v-if="updateVersionsAllowed && !isCurrentVersionGlobal" clickable @click="openRenameDialog">
					<VListItemIcon>
						<VIcon name="edit" />
					</VListItemIcon>

					<VListItemContent>{{ $t('rename_version') }}</VListItemContent>
				</VListItem>

				<VListItem
					v-if="deleteVersionsAllowed"
					:disabled="isCurrentVersionNew"
					class="version-delete"
					clickable
					@click="deleteDialogActive = true"
				>
					<VListItemIcon>
						<VIcon :name="isCurrentVersionGlobal ? 'undo' : 'delete'" />
					</VListItemIcon>

					<VListItemContent>{{ $t(isCurrentVersionGlobal ? 'discard_changes' : 'delete_version') }}</VListItemContent>
				</VListItem>
			</template>
		</VList>
	</VMenu>

	<VDialog v-model="switchDialogActive" @esc="switchDialogActive = false" @apply="switchVersion">
		<VCard>
			<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
			<VCardText>
				{{
					$t('switch_version_copy', {
						version: switchTarget ? switchTarget.name || switchTarget.key : $t('published'),
					})
				}}
			</VCardText>
			<VCardActions>
				<VButton secondary @click="switchVersion()">
					{{ $t('switch_version') }}
				</VButton>
				<VButton @click="switchDialogActive = false">{{ $t('keep_editing') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>

	<VDialog :model-value="createDialogActive" persistent @esc="closeCreateDialog" @apply="createVersion">
		<VCard>
			<VCardTitle>{{ $t('create_version') }}</VCardTitle>

			<VCardText>
				<div class="grid">
					<div class="field">
						<VInput
							v-model="newVersionName"
							class="full"
							:placeholder="$t('version_name')"
							autofocus
							trim
							:max-length="255"
						/>
					</div>

					<div class="field">
						<VInput v-model="newVersionKey" class="full" :placeholder="$t('version_key')" slug trim :max-length="64" />
					</div>
				</div>
			</VCardText>

			<VCardActions>
				<VButton secondary @click="closeCreateDialog">{{ $t('cancel') }}</VButton>
				<VButton
					v-tooltip.top="newVersionKeyReservedTooltip"
					:disabled="isCreateDisabled"
					:loading="creating"
					@click="createVersion"
				>
					{{ $t('save') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>

	<VDialog :model-value="renameDialogActive" persistent @esc="closeRenameDialog" @apply="renameVersion">
		<VCard>
			<VCardTitle>{{ $t('rename_version') }}</VCardTitle>

			<VCardText>
				<div class="grid">
					<div class="field">
						<VInput
							v-model="newVersionName"
							autofocus
							class="full"
							:placeholder="$t('version_name')"
							trim
							:max-length="255"
						/>
					</div>
					<div class="field">
						<VInput v-model="newVersionKey" class="full" :placeholder="$t('version_key')" slug trim :max-length="64" />
					</div>
				</div>
			</VCardText>

			<VCardActions>
				<VButton secondary @click="closeRenameDialog">{{ $t('cancel') }}</VButton>
				<VButton
					v-tooltip.top="newVersionKeyReservedTooltip"
					:disabled="isRenameDisabled"
					:loading="updating"
					@click="renameVersion"
				>
					{{ $t('save') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>

	<VDialog
		v-if="currentVersion !== null"
		v-model="deleteDialogActive"
		@esc="deleteDialogActive = false"
		@apply="onDeleteVersion"
	>
		<VCard>
			<VCardTitle>
				{{
					isCurrentVersionGlobal
						? $t('discard_changes_copy')
						: $t('delete_version_copy', { version: getVersionDisplayName(currentVersion) })
				}}
			</VCardTitle>
			<VCardActions>
				<VButton secondary @click="deleteDialogActive = false">{{ $t('cancel') }}</VButton>
				<VButton :loading="deleteVersionLoading" kind="danger" @click="onDeleteVersion">
					{{ $t(isCurrentVersionGlobal ? 'discard_label' : 'delete_label') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style scoped lang="scss">
@use '@/styles/mixins';

.grid {
	--theme--form--row-gap: 0.4375rem;

	@include mixins.form-grid;
}

.version-menu {
	flex-shrink: 1;
}

.version-list {
	--v-list-max-width: 16.3125rem;
}

.version-item {
	&.active {
		--focus-ring-color: var(--v-list-item-color-active);
		--focus-ring-offset: var(--focus-ring-offset-inset);
	}

	.version-item-icon {
		inline-size: var(--v-icon-size, var(--icon-size-default));
		display: flex;
		justify-content: center;
	}

	.edit-dot {
		display: block;
		inline-size: 0.5rem;
		block-size: 0.5rem;
		border-radius: 0.5rem;
		transition: inherit;
		background-color: var(--theme--foreground);

		&.edit-dot-primary {
			background-color: var(--primary);
		}

		&.edit-dot-secondary {
			background-color: var(--secondary);
		}
	}
}

.version-delete {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--v-list-item-color);
	--v-list-item-icon-color: var(--v-list-item-color);
}
</style>
