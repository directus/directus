<script setup lang="ts">
import type { ContentVersion, PrimaryKey } from '@directus/types';
import slugify from '@sindresorhus/slugify';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
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
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { DRAFT_VERSION_KEY } from '@/constants';
import type { ContentVersionMaybeNew, ContentVersionWithType } from '@/types/versions';
import { getVersionDisplayName } from '@/utils/get-version-display-name';
import { unexpectedError } from '@/utils/unexpected-error';
import ComparisonModal from '@/views/private/components/comparison/comparison-modal.vue';

interface Props {
	collection: string;
	primaryKey: PrimaryKey;
	updateAllowed: boolean;
	hasEdits: boolean;
	currentVersion: ContentVersionMaybeNew | null;
	versions: ContentVersionMaybeNew[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
	add: [version: ContentVersion];
	update: [updates: { key: string; name?: string | null }];
	delete: [deleteOnPromote: boolean];
	switch: [version: ContentVersionMaybeNew | null];
}>();

const { collection, primaryKey, hasEdits, currentVersion, versions } = toRefs(props);

const { t } = useI18n();

const draftVersion = computed(() => versions.value.find((version) => version.key === DRAFT_VERSION_KEY));
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

const { deleting, deleteVersion } = useDelete();
const { deleteDialogActive, onDeleteVersion } = useDeleteDialog();

const { comparisonModalActive, comparableVersion, onPromoteComplete } = useComparisonDialog();

const { isCurrentVersionGlobal, isCurrentVersionNew, canAccessGlobalVersion, isVersionKeyGlobal, isVersionNew } =
	useGlobalVersions();

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

function useDelete() {
	const deleting = ref(false);

	return {
		deleting,
		deleteVersion,
	};

	async function deleteVersion(deleteOnPromote = false) {
		if (!currentVersion.value) return;

		deleting.value = true;

		try {
			await api.delete(`/versions/${currentVersion.value.id}`);

			emit('delete', deleteOnPromote);
		} catch (error) {
			unexpectedError(error);
		} finally {
			deleting.value = false;
		}
	}
}

function useDeleteDialog() {
	const deleteDialogActive = ref(false);

	return {
		deleteDialogActive,
		onDeleteVersion,
	};

	async function onDeleteVersion() {
		if (deleting.value) return;

		await deleteVersion();
		deleteDialogActive.value = false;
	}
}

function useComparisonDialog() {
	const comparisonModalActive = ref(false);

	const comparableVersion = computed(() => {
		if (currentVersion.value === null) return null;
		if (currentVersion.value.id === '+') return undefined;
		return currentVersion.value as ContentVersionWithType;
	});

	return {
		comparisonModalActive,
		comparableVersion,
		onPromoteComplete,
	};

	async function onPromoteComplete(deleteOnPromote: boolean) {
		comparisonModalActive.value = false;

		if (deleteOnPromote) {
			await deleteVersion(true);
			return;
		}

		emit('switch', null);
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
	<div class="version-menu-wrapper">
		<VMenu class="version-menu" placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<button class="version-button" type="button" @click="toggle">
					<VIcon name="published_with_changes" />
					<VTextOverflow class="version-name" :text="getVersionDisplayName(currentVersion)" placement="bottom" />
					<VIcon small name="arrow_drop_down" />
				</button>
			</template>

			<VList class="version-list">
				<VListItem class="version-item" clickable :active="currentVersion === null" @click="switchVersion(null)">
					<VListItemContent>
						{{ $t('main_version') }}
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
					<VListItemContent>
						<VTextOverflow :text="getVersionDisplayName(draftVersion)" />
					</VListItemContent>

					<span v-if="hasVersionEdits(draftVersion)" v-tooltip="$t('content_edited')" class="edit-dot" />
				</VListItem>

				<VListItem
					v-for="versionItem of localVersions"
					:key="versionItem.id"
					class="version-item"
					clickable
					:active="versionItem.id === currentVersion?.id"
					@click="switchVersion(versionItem)"
				>
					<VListItemContent>
						<VTextOverflow :text="getVersionDisplayName(versionItem)" />
					</VListItemContent>

					<span v-if="hasVersionEdits(versionItem)" v-tooltip="$t('content_edited')" class="edit-dot" />
				</VListItem>

				<template v-if="createVersionsAllowed">
					<VDivider />

					<VListItem clickable @click="createDialogActive = true">
						<VListItemContent>{{ $t('create_version') }}</VListItemContent>
					</VListItem>
				</template>

				<template v-if="currentVersion !== null">
					<VDivider />

					<VListItem
						v-if="updateAllowed"
						:disabled="isCurrentVersionNew"
						clickable
						@click="comparisonModalActive = true"
					>
						<VListItemContent>{{ $t('promote_version') }}</VListItemContent>
					</VListItem>

					<VListItem v-if="updateVersionsAllowed && !isCurrentVersionGlobal" clickable @click="openRenameDialog">
						<VListItemContent>{{ $t('rename_version') }}</VListItemContent>
					</VListItem>

					<VListItem
						v-if="deleteVersionsAllowed"
						:disabled="isCurrentVersionNew"
						class="version-delete"
						clickable
						@click="deleteDialogActive = true"
					>
						<VListItemContent>{{ $t(isCurrentVersionGlobal ? 'discard_changes' : 'delete_version') }}</VListItemContent>
					</VListItem>
				</template>
			</VList>
		</VMenu>

		<ComparisonModal
			v-if="comparableVersion"
			v-model="comparisonModalActive"
			:delete-versions-allowed
			:collection
			:primary-key
			mode="version"
			:current-version="comparableVersion"
			@cancel="comparisonModalActive = false"
			@promote="onPromoteComplete"
		/>

		<VDialog v-model="switchDialogActive" @esc="switchDialogActive = false" @apply="switchVersion">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>
					{{
						$t('switch_version_copy', {
							version: switchTarget ? switchTarget.name || switchTarget.key : $t('main_version'),
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
							<VInput
								v-model="newVersionKey"
								class="full"
								:placeholder="$t('version_key')"
								slug
								trim
								:max-length="64"
							/>
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
							<VInput
								v-model="newVersionKey"
								class="full"
								:placeholder="$t('version_key')"
								slug
								trim
								:max-length="64"
							/>
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
					<VButton :loading="deleting" kind="danger" @click="onDeleteVersion">
						{{ $t(isCurrentVersionGlobal ? 'discard_label' : 'delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins';

.grid {
	--theme--form--row-gap: 8px;

	@include mixins.form-grid;
}

.version-menu-wrapper {
	overflow: hidden;
	display: flex;
	align-items: center;

	@media (min-width: 600px) {
		&::before {
			content: '•';
			padding-inline-end: 0.25rem;
			color: var(--theme--foreground-subdued);
		}
	}
}

.version-menu {
	flex-shrink: 1;
}

.version-list {
	--v-list-max-width: 290px;
}

.version-item {
	--v-list-item-color-active: var(--foreground-inverted);
	--v-list-item-background-color-active: var(--theme--primary);
	--v-list-item-color-active-hover: var(--white);
	--v-list-item-background-color-active-hover: var(--theme--primary-accent);

	gap: 1em;

	&.active {
		--focus-ring-color: var(--v-list-item-color-active);
		--focus-ring-offset: var(--focus-ring-offset-inset);
	}

	.edit-dot {
		display: block;
		inline-size: 8px;
		block-size: 8px;
		border-radius: 8px;
		background-color: var(--theme--primary);
		transition: inherit;
	}

	&.active,
	&:active {
		.edit-dot {
			background-color: var(--v-list-item-color-active);
		}
	}
}

.version-delete {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
}

.version-name {
	margin-inline-start: 0.15em;
}

.version-button {
	--v-icon-size: 1rem;

	color: var(--theme--foreground-subdued);
	display: flex;
	align-items: center;
	pointer-events: all;

	&:hover {
		color: var(--theme--foreground);
	}

	&:focus-visible {
		--focus-ring-offset: var(--focus-ring-offset-invert);

		padding-inline-start: var(--focus-ring-width);
		margin-inline-end: var(--focus-ring-width);
	}
}
</style>
