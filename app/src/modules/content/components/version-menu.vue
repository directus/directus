<script setup lang="ts">
import api from '@/api';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { getVersionDisplayName } from '@/utils/get-version-display-name';
import { unexpectedError } from '@/utils/unexpected-error';
import ComparisonModal from '@/views/private/components/comparison/comparison-modal.vue';
import { ContentVersion, PrimaryKey } from '@directus/types';
import slugify from '@sindresorhus/slugify';
import { computed, ref, toRefs, unref, watch } from 'vue';

interface Props {
	collection: string;
	primaryKey: PrimaryKey;
	updateAllowed: boolean;
	hasEdits: boolean;
	currentVersion: ContentVersion | null;
	versions: ContentVersion[] | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	add: [version: ContentVersion];
	update: [updates: { key: string; name?: string | null }];
	delete: [];
	switch: [version: ContentVersion | null];
}>();


const { collection, primaryKey, hasEdits, currentVersion, versions } = toRefs(props);

const comparisonModalActive = ref(false);

const {
	createAllowed: createVersionsAllowed,
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

function useSwitchDialog() {
	const switchDialogActive = ref(false);
	const switchTarget = ref<ContentVersion | null>(null);

	return {
		switchDialogActive,
		switchTarget,
		switchVersion,
	};

	function switchVersion(version?: ContentVersion | null) {
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
	const isCreateDisabled = computed(() => newVersionKey.value === null);

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
		if (isCreateDisabled.value || creating.value) return;

		if (!unref(primaryKey) || unref(primaryKey) === '+') return;

		creating.value = true;

		try {
			const {
				data: { data: version },
			} = await api.post(`/versions`, {
				key: unref(newVersionKey),
				...(unref(newVersionName) ? { name: unref(newVersionName) } : {}),
				collection: unref(collection),
				item: String(unref(primaryKey)),
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
			!unref(primaryKey) ||
			unref(primaryKey) === '+' ||
			!newVersionKey.value,
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
		if (isRenameDisabled.value || updating.value || newVersionKey.value === null) return;

		updating.value = true;

		try {
			const updates = {
				key: newVersionKey.value,
				...(newVersionName.value !== currentVersion.value?.name && { name: newVersionName.value }),
			};

			await api.patch(`/versions/${unref(currentVersion)!.id}`, updates);

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

	async function deleteVersion() {
		if (!currentVersion.value) return;

		deleting.value = true;

		try {
			await api.delete(`/versions/${currentVersion.value.id}`);

			emit('delete');
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

async function onPromoteComplete(deleteOnPromote: boolean) {
	comparisonModalActive.value = false;

	if (deleteOnPromote) {
		await deleteVersion();
	} else {
		emit('switch', null);
	}
}
</script>

<template>
	<div class="version-menu-wrapper">
		<v-menu class="version-menu" placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<button class="version-button" type="button" @click="toggle">
					<v-icon name="published_with_changes" />
					<v-text-overflow class="version-name" :text="getVersionDisplayName(currentVersion)" placement="bottom" />
					<v-icon small name="arrow_drop_down" />
				</button>
			</template>

			<v-list>
				<v-list-item class="version-item" clickable :active="currentVersion === null" @click="switchVersion(null)">
					{{ $t('main_version') }}
				</v-list-item>

				<v-list-item
					v-for="versionItem of versions"
					:key="versionItem.id"
					class="version-item"
					clickable
					:active="versionItem.id === currentVersion?.id"
					@click="switchVersion(versionItem)"
				>
					{{ getVersionDisplayName(versionItem) }}
				</v-list-item>

				<template v-if="createVersionsAllowed">
					<v-divider />

					<v-list-item clickable @click="createDialogActive = true">
						{{ $t('create_version') }}
					</v-list-item>
				</template>

				<template v-if="currentVersion !== null">
					<v-divider />

					<v-list-item v-if="updateAllowed" clickable @click="comparisonModalActive = true">
						{{ $t('promote_version') }}
					</v-list-item>

					<v-list-item v-if="updateVersionsAllowed" clickable @click="openRenameDialog">
						{{ $t('rename_version') }}
					</v-list-item>

					<v-list-item v-if="deleteVersionsAllowed" class="version-delete" clickable @click="deleteDialogActive = true">
						{{ $t('delete_version') }}
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<comparison-modal
			v-if="currentVersion !== null"
			v-model="comparisonModalActive"
			:delete-versions-allowed
			:collection
			:primary-key
			mode="version"
			:current-version
			@cancel="comparisonModalActive = false"
			@promote="onPromoteComplete($event)"
		/>

		<v-dialog v-model="switchDialogActive" @esc="switchDialogActive = false" @apply="switchVersion">
			<v-card>
				<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
				<v-card-text>
					{{
						t('switch_version_copy', {
							version: switchTarget ? switchTarget.name || switchTarget.key : t('main_version'),
						})
					}}
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="switchVersion()">
						{{ $t('switch_version') }}
					</v-button>
					<v-button @click="switchDialogActive = false">{{ $t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :model-value="createDialogActive" persistent @esc="closeCreateDialog" @apply="createVersion">
			<v-card>
				<v-card-title>{{ $t('create_version') }}</v-card-title>

				<v-card-text>
					<div class="grid">
						<div class="field">
							<v-input
								v-model="newVersionName"
								class="full"
								:placeholder="$t('version_name')"
								autofocus
								trim
								:max-length="255"
							/>
						</div>

						<div class="field">
							<v-input
								v-model="newVersionKey"
								class="full"
								:placeholder="$t('version_key')"
								slug
								trim
								:max-length="64"
							/>
						</div>
					</div>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="closeCreateDialog">{{ $t('cancel') }}</v-button>
					<v-button :disabled="isCreateDisabled" :loading="creating" @click="createVersion">
						{{ $t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :model-value="renameDialogActive" persistent @esc="closeRenameDialog" @apply="renameVersion">
			<v-card>
				<v-card-title>{{ $t('rename_version') }}</v-card-title>

				<v-card-text>
					<div class="grid">
						<div class="field">
							<v-input
								v-model="newVersionName"
								autofocus
								class="full"
								:placeholder="$t('version_name')"
								trim
								:max-length="255"
							/>
						</div>
						<div class="field">
							<v-input
								v-model="newVersionKey"
								class="full"
								:placeholder="$t('version_key')"
								slug
								trim
								:max-length="64"
							/>
						</div>
					</div>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="closeRenameDialog">{{ $t('cancel') }}</v-button>
					<v-button :disabled="isRenameDisabled" :loading="updating" @click="renameVersion">
						{{ $t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog
			v-if="currentVersion !== null"
			v-model="deleteDialogActive"
			@esc="deleteDialogActive = false"
			@apply="onDeleteVersion"
		>
			<v-card>
				<v-card-title>{{ $t('delete_version_copy', { version: currentVersion!.name }) }}</v-card-title>
				<v-card-actions>
					<v-button secondary @click="deleteDialogActive = false">{{ $t('cancel') }}</v-button>
					<v-button :loading="deleting" kind="danger" @click="onDeleteVersion">
						{{ $t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
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

.version-item {
	--v-list-item-color-active: var(--foreground-inverted);
	--v-list-item-background-color-active: var(--theme--primary);
	--v-list-item-color-active-hover: var(--white);
	--v-list-item-background-color-active-hover: var(--theme--primary-accent);

	&.active {
		--focus-ring-color: var(--v-list-item-color-active);
		--focus-ring-offset: var(--focus-ring-offset-inset);
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
		outline-offset: 0;
		margin-inline-end: var(--focus-ring-width);
	}
}
</style>
