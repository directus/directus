<script setup lang="ts">
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { Header, Sort } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { router } from '@/router';
import { unexpectedError } from '@/utils/unexpected-error';
import SearchInput from '@/views/private/components/search-input.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import { sortBy } from 'lodash';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppNavigation from '../components/app-navigation.vue';
import { useMinis, MiniApp } from '../composables/use-minis';

const { t } = useI18n();

const { minis, loading, fetchMinis, createMiniApp, deleteMiniApp } = useMinis();

onMounted(() => {
	fetchMinis();
});

const confirmDelete = ref<string | null>(null);
const deletingApp = ref(false);

const selection = ref<string[]>([]);
const search = ref<string | null>(null);

const createDialogActive = ref(false);
const newAppName = ref('');

const { createAllowed, deleteAllowed } = useCollectionPermissions('directus_minis');

const internalSort = ref<Sort>({ by: 'name', desc: false });

function updateSort(sort: Sort | null) {
	internalSort.value = sort ?? { by: 'name', desc: false };
}

const tableHeaders = ref<Header[]>([
	{
		text: '',
		value: 'icon',
		width: 42,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('name'),
		value: 'name',
		width: 240,
		sortable: true,
		align: 'left',
		description: null,
	},
	{
		text: t('description'),
		value: 'description',
		width: 360,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('status'),
		value: 'status',
		width: 100,
		sortable: true,
		align: 'left',
		description: null,
	},
]);

const filteredApps = computed<MiniApp[]>(() => {
	const searchedApps = search.value
		? minis.value.filter((mini) => mini.name.toLowerCase().includes(search.value!.toLowerCase()))
		: minis.value;

	const sortedApps = sortBy(searchedApps, [internalSort.value.by]) as MiniApp[];
	return internalSort.value.desc ? sortedApps.reverse() : sortedApps;
});

function navigateToApp({ item: miniApp }: { item: MiniApp }) {
	router.push(`/minis/${miniApp.id}`);
}

async function handleCreateApp() {
	if (!newAppName.value.trim()) return;

	try {
		const newMiniApp = await createMiniApp({
			name: newAppName.value.trim(),
			icon: 'apps',
			status: 'draft',
			ui_schema: {
				type: 'div',
				props: { class: 'app-container' },
				children: [
					{
						type: 'v-notice',
						props: { type: 'info' },
						children: [t('minis.welcome_message')],
					},
				],
			},
			css: '.app-container { padding: 20px; }',
			script:
				"// Initialize state\nstate.message = 'Hello World!';\n\n// Define actions\nactions.init = async () => {\n  console.log('App initialized');\n};",
		});

		createDialogActive.value = false;
		newAppName.value = '';
		router.push(`/minis/${newMiniApp.id}`);
	} catch (error) {
		unexpectedError(error);
	}
}

async function handleDeleteApp() {
	if (deletingApp.value || !confirmDelete.value) return;

	deletingApp.value = true;

	try {
		await deleteMiniApp(confirmDelete.value);
		confirmDelete.value = null;
	} catch (error) {
		unexpectedError(error);
	} finally {
		deletingApp.value = false;
	}
}

const confirmBatchDelete = ref(false);
const batchDeleting = ref(false);

async function batchDelete() {
	if (batchDeleting.value) return;

	batchDeleting.value = true;

	try {
		await api.delete('/minis', {
			data: selection.value,
		});

		selection.value = [];
		fetchMinis();
	} catch (error) {
		unexpectedError(error);
	} finally {
		confirmBatchDelete.value = false;
		batchDeleting.value = false;
	}
}
</script>

<template>
	<PrivateView :title="t('minis.label')" icon="apps">
		<template #navigation>
			<AppNavigation :apps="minis" :loading="loading" @create="createDialogActive = true" />
		</template>

		<template #actions>
			<SearchInput
				v-if="minis.length > 0"
				v-model="search"
				:show-filter="false"
				:autofocus="minis.length > 25"
				:placeholder="t('search_placeholder')"
				small
			/>

			<VDialog
				v-if="selection.length > 0"
				v-model="confirmBatchDelete"
				@esc="confirmBatchDelete = false"
				@apply="batchDelete"
			>
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="deleteAllowed ? t('delete_label') : t('not_allowed')"
						:disabled="deleteAllowed !== true"
						class="action-delete"
						secondary
						icon="delete"
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ t('minis.delete_batch_confirm', { count: selection.length }) }}</VCardTitle>

					<VCardActions>
						<VButton secondary @click="confirmBatchDelete = false">
							{{ t('cancel') }}
						</VButton>
						<VButton kind="danger" :loading="batchDeleting" @click="batchDelete">
							{{ t('delete_label') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<VDialog v-model="createDialogActive" @esc="createDialogActive = false">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="createAllowed ? t('minis.create_mini_app') : t('not_allowed')"
						:disabled="createAllowed === false"
						icon="add"
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ t('minis.create_mini_app') }}</VCardTitle>

					<div class="card-content">
						<VInput
							v-model="newAppName"
							:placeholder="t('minis.app_name')"
							autofocus
							@keyup.enter="handleCreateApp"
						/>
					</div>

					<VCardActions>
						<VButton secondary @click="createDialogActive = false">
							{{ t('cancel') }}
						</VButton>
						<VButton :disabled="!newAppName.trim()" @click="handleCreateApp">
							{{ t('create') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>
		</template>

		<VTable
			v-if="filteredApps.length > 0"
			v-model:headers="tableHeaders"
			v-model="selection"
			:items="filteredApps"
			show-resize
			fixed-header
			:sort="internalSort"
			selection-use-keys
			item-key="id"
			show-select="multiple"
			@click:row="navigateToApp"
			@update:sort="updateSort($event)"
		>
			<template #[`item.icon`]="{ item }">
				<VIcon class="icon" :name="item.icon || 'apps'" />
			</template>

			<template #[`item.status`]="{ item }">
				<span :class="['status-badge', item.status]">{{ item.status }}</span>
			</template>

			<template #item-append="{ item }">
				<VMenu placement="left-start" show-arrow>
					<template #activator="{ toggle }">
						<VIcon name="more_vert" class="ctx-toggle" clickable @click="toggle" />
					</template>
					<template #default="{ toggle }">
						<VList>
							<VListItem
								clickable
								@click="
									router.push(`/minis/${item.id}`);
									toggle();
								"
							>
								<VListItemIcon>
									<VIcon name="open_in_new" />
								</VListItemIcon>
								<VListItemContent>{{ t('minis.open_mini_app') }}</VListItemContent>
							</VListItem>

							<VListItem
								class="danger"
								:disabled="!deleteAllowed"
								clickable
								@click="
									confirmDelete = item.id;
									toggle();
								"
							>
								<VListItemIcon>
									<VIcon name="delete" />
								</VListItemIcon>
								<VListItemContent>{{ t('delete_label') }}</VListItemContent>
							</VListItem>
						</VList>
					</template>
				</VMenu>
			</template>
		</VTable>

		<VInfo v-else-if="search" icon="search" :title="t('minis.no_minis')" center>
			{{ t('minis.no_minis_copy') }}

			<template #append>
				<VButton @click="search = null">{{ t('minis.clear_search') }}</VButton>
			</template>
		</VInfo>

		<VInfo v-else-if="!loading" icon="apps" :title="t('minis.no_minis')" center>
			{{ t('minis.no_minis_copy') }}

			<template v-if="createAllowed" #append>
				<VButton @click="createDialogActive = true">{{ t('minis.create_mini_app') }}</VButton>
			</template>
		</VInfo>

		<VDialog :model-value="!!confirmDelete" @esc="confirmDelete = null" @apply="handleDeleteApp">
			<VCard>
				<VCardTitle>{{ t('minis.delete_mini_app_confirm') }}</VCardTitle>

				<VCardActions>
					<VButton secondary @click="confirmDelete = null">
						{{ t('cancel') }}
					</VButton>
					<VButton kind="danger" :loading="deletingApp" @click="handleDeleteApp">
						{{ t('delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style scoped lang="scss">
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.v-table {
	padding: var(--content-padding);
}

.ctx-toggle {
	--v-icon-color: var(--theme--foreground-subdued);
	--v-icon-color-hover: var(--theme--foreground);
}

.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}

.card-content {
	padding: 4px var(--v-card-padding) 12px;
}

.status-badge {
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 12px;
	text-transform: capitalize;

	&.draft {
		background: var(--theme--background-accent);
		color: var(--theme--foreground-subdued);
	}

	&.published {
		background: var(--theme--success);
		color: var(--white);
	}
}
</style>
