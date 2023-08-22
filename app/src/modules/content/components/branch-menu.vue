<template>
	<div>
		<v-menu class="branch-menu" placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<button class="branch-button" @click="toggle">
					<span class="branch-name">{{ currentBranch ? currentBranch.name : t('main_branch') }}</span>
					<v-icon name="arrow_drop_down" />
				</button>
			</template>

			<v-list>
				<v-list-item class="branch-item" clickable :active="currentBranch === null" @click="$emit('switch', null)">
					{{ t('main_branch') }}
				</v-list-item>

				<v-list-item
					v-for="branchItem of branches"
					:key="branchItem.id"
					class="branch-item"
					clickable
					:active="branchItem.id === currentBranch?.id"
					@click="$emit('switch', branchItem)"
				>
					{{ branchItem.name }}
				</v-list-item>

				<template v-if="createBranchesAllowed">
					<v-divider />

					<v-list-item clickable @click="createDialogActive = true">
						{{ t('create_branch') }}
					</v-list-item>
				</template>

				<template v-if="currentBranch !== null">
					<v-divider />

					<v-list-item v-if="updateBranchesAllowed" clickable @click="openUpdateDialog">
						{{ t('rename_branch') }}
					</v-list-item>

					<v-list-item clickable @click="isBranchMergeDrawerOpen = true">
						{{ t('merge_branch') }}
					</v-list-item>

					<v-list-item v-if="deleteBranchesAllowed" class="branch-delete" clickable @click="deleteDialogActive = true">
						{{ t('delete_branch') }}
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<branch-merge-drawer
			v-if="currentBranch !== null"
			:active="isBranchMergeDrawerOpen"
			:current-branch="currentBranch"
			@cancel="isBranchMergeDrawerOpen = false"
			@merge="isBranchMergeDrawerOpen = false"
		/>

		<v-dialog :model-value="createDialogActive" persistent @esc="closeCreateDialog">
			<v-card>
				<v-card-title>{{ t('create_branch') }}</v-card-title>

				<v-card-text>
					<div class="fields">
						<interface-input
							:value="newBranchName"
							class="full"
							autofocus
							trim
							:placeholder="t('branch_name')"
							@input="newBranchName = $event"
							@keyup.enter="createBranch"
						/>
					</div>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="closeCreateDialog">{{ t('cancel') }}</v-button>
					<v-button :disabled="newBranchName === null" :loading="creating" @click="createBranch">
						{{ t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :model-value="updateDialogActive" persistent @esc="closeUpdateDialog">
			<v-card>
				<v-card-title>{{ t('rename_branch') }}</v-card-title>

				<v-card-text>
					<div class="fields">
						<interface-input
							:value="newBranchName"
							class="full"
							autofocus
							trim
							:placeholder="t('branch_name')"
							@input="newBranchName = $event"
							@keyup.enter="updateBranch"
						/>
					</div>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="closeUpdateDialog">{{ t('cancel') }}</v-button>
					<v-button :disabled="newBranchName === null" :loading="updating" @click="updateBranch">
						{{ t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-if="currentBranch !== null" v-model="deleteDialogActive" @esc="deleteDialogActive = false">
			<v-card>
				<v-card-title>{{ t('delete_branch_copy', { branch: currentBranch!.name }) }}</v-card-title>
				<v-card-actions>
					<v-button secondary @click="deleteDialogActive = false">{{ t('cancel') }}</v-button>
					<v-button :loading="deleting" kind="danger" @click="deleteBranch">
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
import { Branch } from '@directus/types';
import { computed, ref, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import BranchMergeDrawer from './branch-merge-drawer.vue';

interface Props {
	collection: string;
	primaryKey: string | number;
	currentBranch: Branch | null;
	branches: Branch[] | null;
}

const props = defineProps<Props>();

const emit = defineEmits(['switch', 'refresh']);

const { t } = useI18n();

const { hasPermission } = usePermissionsStore();

const { collection, primaryKey, currentBranch } = toRefs(props);

const newBranchName = ref<string | null>(null);
const isBranchMergeDrawerOpen = ref<boolean>(false);

const createBranchesAllowed = computed<boolean>(() => hasPermission('directus_branches', 'create'));
const updateBranchesAllowed = computed<boolean>(() => hasPermission('directus_branches', 'update'));
const deleteBranchesAllowed = computed<boolean>(() => hasPermission('directus_branches', 'delete'));

const { createDialogActive, closeCreateDialog, creating, createBranch } = useCreateDialog();
const { updateDialogActive, openUpdateDialog, closeUpdateDialog, updating, updateBranch } = useUpdateDialog();
const { deleteDialogActive, deleting, deleteBranch } = useDeleteDialog();

function useCreateDialog() {
	const createDialogActive = ref(false);
	const creating = ref(false);

	return {
		newBranchName,
		createDialogActive,
		creating,
		createBranch,
		closeCreateDialog,
	};

	async function createBranch() {
		if (!unref(primaryKey) || unref(primaryKey) === '+') return;

		creating.value = true;

		try {
			await api.post(`/branches`, {
				name: unref(newBranchName),
				collection: unref(collection),
				item: unref(primaryKey),
			});

			emit('refresh');
			createDialogActive.value = false;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			creating.value = false;
		}
	}

	function closeCreateDialog() {
		newBranchName.value = null;
		createDialogActive.value = false;
	}
}

function useUpdateDialog() {
	const updateDialogActive = ref(false);
	const updating = ref(false);

	return {
		newBranchName,
		updateDialogActive,
		updating,
		updateBranch,
		openUpdateDialog,
		closeUpdateDialog,
	};

	async function updateBranch() {
		if (!unref(primaryKey) || unref(primaryKey) === '+') return;

		updating.value = true;

		try {
			await api.patch(`/branches/${unref(currentBranch)!.id}`, {
				name: unref(newBranchName),
			});

			emit('refresh');
			updateDialogActive.value = false;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			updating.value = false;
		}
	}

	function openUpdateDialog() {
		if (!unref(currentBranch)) return;
		newBranchName.value = unref(currentBranch)!.name;
		updateDialogActive.value = true;
	}

	function closeUpdateDialog() {
		newBranchName.value = null;
		updateDialogActive.value = false;
	}
}

function useDeleteDialog() {
	const deleteDialogActive = ref(false);
	const deleting = ref(false);

	return {
		deleteDialogActive,
		deleting,
		deleteBranch,
	};

	async function deleteBranch() {
		if (!unref(currentBranch)) return;

		deleting.value = true;

		try {
			await api.delete(`/branches/${unref(currentBranch)!.id}`);
			emit('switch', null);
			emit('refresh');
			deleteDialogActive.value = false;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			deleting.value = false;
		}
	}
}
</script>

<style scoped lang="scss">
.branch-menu {
	flex-shrink: 0;
}

.branch-item {
	--v-list-item-color-active: var(--foreground-inverted);
	--v-list-item-background-color-active: var(--primary);
}

.branch-button {
	display: flex;
	margin-left: 16px;
	background-color: var(--primary-25);
	color: var(--primary);
	border-radius: 24px;

	.branch-name {
		padding-left: 8px;
	}
}

.branch-delete {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
}
</style>
