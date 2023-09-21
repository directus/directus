<template>
	<div>
		<v-menu class="version-menu" placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<button class="version-button" :class="{ main: currentVersion === null }" @click="toggle">
					<span class="version-name">{{ currentVersion ? currentVersion.name : t('main_version') }}</span>
					<v-icon name="arrow_drop_down" />
				</button>
			</template>

			<v-list>
				<v-list-item class="version-item" clickable :active="currentVersion === null" @click="$emit('switch', null)">
					{{ t('main_version') }}
				</v-list-item>

				<v-list-item
					v-for="versionItem of versions"
					:key="versionItem.id"
					class="version-item"
					clickable
					:active="versionItem.id === currentVersion?.id"
					@click="$emit('switch', versionItem)"
				>
					{{ versionItem.name }}
				</v-list-item>

				<template v-if="createVersionsAllowed">
					<v-divider />

					<v-list-item clickable @click="createDialogActive = true">
						{{ t('create_version') }}
					</v-list-item>
				</template>

				<template v-if="currentVersion !== null">
					<v-divider />

					<v-list-item v-if="updateVersionsAllowed" clickable @click="openUpdateDialog">
						{{ t('rename_version') }}
					</v-list-item>

					<v-list-item clickable @click="isVersionPromoteDrawerOpen = true">
						{{ t('promote_version') }}
					</v-list-item>

					<v-list-item v-if="deleteVersionsAllowed" class="version-delete" clickable @click="deleteDialogActive = true">
						{{ t('delete_version') }}
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<version-promote-drawer
			v-if="currentVersion !== null"
			:active="isVersionPromoteDrawerOpen"
			:current-version="currentVersion"
			@cancel="isVersionPromoteDrawerOpen = false"
			@promote="onPromoteComplete"
		/>

		<v-dialog :model-value="createDialogActive" persistent @esc="closeCreateDialog">
			<v-card>
				<v-card-title>{{ t('create_version') }}</v-card-title>

				<v-card-text>
					<div class="grid">
						<div class="field">
							<v-input
								v-model="newVersionName"
								autofocus
								:placeholder="t('version_name')"
								trim
								@input="newVersionName = $event"
								@keyup.enter="createVersion"
							/>
						</div>
					</div>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="closeCreateDialog">{{ t('cancel') }}</v-button>
					<v-button :disabled="newVersionName === null" :loading="creating" @click="createVersion">
						{{ t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :model-value="updateDialogActive" persistent @esc="closeUpdateDialog">
			<v-card>
				<v-card-title>{{ t('rename_version') }}</v-card-title>

				<v-card-text>
					<div class="fields">
						<interface-input
							:value="newVersionName"
							class="full"
							autofocus
							trim
							:placeholder="t('version_name')"
							@input="newVersionName = $event"
							@keyup.enter="updateVersion"
						/>
					</div>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="closeUpdateDialog">{{ t('cancel') }}</v-button>
					<v-button :disabled="newVersionName === null" :loading="updating" @click="updateVersion">
						{{ t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-if="currentVersion !== null" v-model="deleteDialogActive" @esc="deleteDialogActive = false">
			<v-card>
				<v-card-title>{{ t('delete_version_copy', { version: currentVersion!.name }) }}</v-card-title>
				<v-card-actions>
					<v-button secondary @click="deleteDialogActive = false">{{ t('cancel') }}</v-button>
					<v-button :loading="deleting" kind="danger" @click="deleteVersion">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { unexpectedError } from '@/utils/unexpected-error';
import { Version } from '@directus/types';
import { computed, ref, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import VersionPromoteDrawer from './version-promote-drawer.vue';

interface Props {
	collection: string;
	primaryKey: string | number;
	currentVersion: Version | null;
	versions: Version[] | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	add: [version: Version];
	rename: [name: string];
	delete: [];
	switch: [version: Version | null];
}>();

const { t } = useI18n();

const { hasPermission } = usePermissionsStore();

const { collection, primaryKey, currentVersion } = toRefs(props);

const newVersionName = ref<string | null>(null);
const isVersionPromoteDrawerOpen = ref(false);

const createVersionsAllowed = computed<boolean>(() => hasPermission('directus_versions', 'create'));
const updateVersionsAllowed = computed<boolean>(() => hasPermission('directus_versions', 'update'));
const deleteVersionsAllowed = computed<boolean>(() => hasPermission('directus_versions', 'delete'));

const { createDialogActive, closeCreateDialog, creating, createVersion } = useCreateDialog();
const { updateDialogActive, openUpdateDialog, closeUpdateDialog, updating, updateVersion } = useUpdateDialog();
const { deleteDialogActive, deleting, deleteVersion } = useDeleteDialog();

function useCreateDialog() {
	const createDialogActive = ref(false);
	const creating = ref(false);

	return {
		newVersionName,
		createDialogActive,
		creating,
		createVersion,
		closeCreateDialog,
	};

	async function createVersion() {
		if (!unref(primaryKey) || unref(primaryKey) === '+') return;

		creating.value = true;

		try {
			const {
				data: { data: version },
			} = await api.post(`/versions`, {
				name: unref(newVersionName),
				collection: unref(collection),
				item: unref(primaryKey),
			});

			emit('add', version);

			closeCreateDialog();
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			creating.value = false;
		}
	}

	function closeCreateDialog() {
		createDialogActive.value = false;
		newVersionName.value = null;
	}
}

function useUpdateDialog() {
	const updateDialogActive = ref(false);
	const updating = ref(false);

	return {
		newVersionName,
		updateDialogActive,
		updating,
		updateVersion,
		openUpdateDialog,
		closeUpdateDialog,
	};

	async function updateVersion() {
		if (!unref(primaryKey) || unref(primaryKey) === '+' || !newVersionName.value) return;

		updating.value = true;

		try {
			await api.patch(`/versions/${unref(currentVersion)!.id}`, {
				name: newVersionName.value,
			});

			emit('rename', newVersionName.value);

			closeUpdateDialog();
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			updating.value = false;
		}
	}

	function openUpdateDialog() {
		if (!currentVersion.value) return;
		newVersionName.value = currentVersion.value.name;
		updateDialogActive.value = true;
	}

	function closeUpdateDialog() {
		updateDialogActive.value = false;
		newVersionName.value = null;
	}
}

function useDeleteDialog() {
	const deleteDialogActive = ref(false);
	const deleting = ref(false);

	return {
		deleteDialogActive,
		deleting,
		deleteVersion,
	};

	async function deleteVersion() {
		if (!currentVersion.value) return;

		deleting.value = true;

		try {
			await api.delete(`/versions/${currentVersion.value.id}`);

			emit('delete');

			deleteDialogActive.value = false;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			deleting.value = false;
		}
	}
}

function onPromoteComplete() {
	isVersionPromoteDrawerOpen.value = false;

	emit('switch', null);
}
</script>

<style scoped lang="scss">
@import '@/styles/mixins/form-grid';

.grid {
	--form-vertical-gap: 8px;

	@include form-grid;
}

.version-menu {
	flex-shrink: 0;
}

.version-item {
	--v-list-item-color-active: var(--foreground-inverted);
	--v-list-item-background-color-active: var(--primary);
}

.version-button {
	display: flex;
	margin-left: 16px;
	padding: 2px;
	background-color: var(--background-normal);
	color: var(--foreground-normal);
	border-radius: 24px;

	.version-name {
		padding-left: 8px;
	}

	&:hover {
		background-color: var(--background-normal-alt);
	}

	&.main {
		background-color: var(--primary);
		color: var(--white);

		&:hover {
			background-color: var(--primary-125);
		}
	}
}

.version-delete {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
}
</style>
