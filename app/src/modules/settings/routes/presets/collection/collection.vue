<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { usePreset } from '@/composables/use-preset';
import { usePresetsStore } from '@/stores/presets';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { useCollection, useLayout } from '@directus/composables';
import { ref } from 'vue';
import SettingsNavigation from '../../../components/navigation.vue';
import PresetsInfoSidebarDetail from './components/presets-info-sidebar-detail.vue';

const layout = ref('tabular');
const collection = ref('directus_presets');

const { layoutOptions, layoutQuery, filter, search, refreshInterval } = usePreset(collection);

const layoutRef = ref();

const { selection } = useSelection();
const { info: currentCollection } = useCollection(collection);

const { layoutWrapper } = useLayout(layout);

const { confirmDelete, deleting, batchDelete, error: deleteError, batchEditActive } = useBatch();

const currentLayout = useExtension('layout', layout);

const {
	updateAllowed: batchEditAllowed,
	deleteAllowed: batchDeleteAllowed,
	createAllowed,
} = useCollectionPermissions(collection);

const presetsStore = usePresetsStore();

async function refresh() {
	await layoutRef.value?.state?.refresh?.();
}

async function drawerBatchRefresh() {
	selection.value = [];
	await refresh();
}

function useSelection() {
	const selection = ref<number[]>([]);

	return { selection };
}

function useBatch() {
	const confirmDelete = ref(false);
	const deleting = ref(false);

	const batchEditActive = ref(false);

	const error = ref<any>(null);

	return { batchEditActive, confirmDelete, deleting, batchDelete, error };

	async function batchDelete() {
		if (deleting.value) return;

		deleting.value = true;

		try {
			const batchPrimaryKeys = selection.value;
			await presetsStore.delete(batchPrimaryKeys);

			selection.value = [];
			await refresh();

			confirmDelete.value = false;
		} catch (err: any) {
			error.value = err;
		} finally {
			deleting.value = false;
		}
	}
}

function clearFilters() {
	filter.value = null;
	search.value = null;
}
</script>

<template>
	<component
		:is="layoutWrapper"
		v-if="currentCollection"
		ref="layoutRef"
		v-slot="{ layoutState }"
		v-model:selection="selection"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:filter-user="filter"
		:filter="filter"
		:search="search"
		:collection="collection"
		:clear-filters="clearFilters"
	>
		<private-view
			:title="$t('settings_presets')"
			:small-header="currentLayout?.smallHeader"
			:header-shadow="currentLayout?.headerShadow"
		>
			<template #headline>
				<v-breadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" />
			</template>

			<template #title-outer:prepend>
				<v-button class="header-icon" rounded icon exact disabled>
					<v-icon name="bookmark" />
				</v-button>
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout || 'tabular'}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<search-input v-model="search" v-model:filter="filter" :collection="collection" />

				<v-dialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false" @apply="batchDelete">
					<template #activator="{ on }">
						<v-button
							v-tooltip.bottom="batchDeleteAllowed ? $t('delete_label') : $t('not_allowed')"
							:disabled="batchDeleteAllowed !== true"
							rounded
							icon
							class="action-delete"
							secondary
							@click="on"
						>
							<v-icon name="delete" outline />
						</v-button>
					</template>

					<v-card>
						<v-card-title>{{ $t('batch_delete_confirm', selection.length) }}</v-card-title>

						<v-card-actions>
							<v-button secondary @click="confirmDelete = false">
								{{ $t('cancel') }}
							</v-button>
							<v-button kind="danger" :loading="deleting" @click="batchDelete">
								{{ $t('delete_label') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-button
					v-if="selection.length > 0"
					v-tooltip.bottom="batchEditAllowed ? $t('edit') : $t('not_allowed')"
					rounded
					icon
					secondary
					:disabled="batchEditAllowed === false"
					@click="batchEditActive = true"
				>
					<v-icon name="edit" outline />
				</v-button>

				<v-button
					v-tooltip.bottom="createAllowed ? $t('create_preset') : $t('not_allowed')"
					rounded
					icon
					to="/settings/presets/+"
					:disabled="createAllowed === false"
				>
					<v-icon name="add" />
				</v-button>
			</template>

			<template #navigation>
				<settings-navigation />
			</template>

			<component :is="`layout-${layout || 'tabular'}`" v-bind="layoutState">
				<template #no-results>
					<v-info :title="$t('no_results')" icon="bookmark" center>
						{{ $t('no_results_copy') }}

						<template #append>
							<v-button @click="clearFilters">{{ $t('clear_filters') }}</v-button>
						</template>
					</v-info>
				</template>

				<template #no-items>
					<v-info :title="$t('no_presets')" icon="bookmark" center>
						{{ $t('no_presets_copy') }}

						<template v-if="createAllowed" #append>
							<v-button :to="`/settings/presets/+`">{{ $t('create_preset') }}</v-button>
						</template>
					</v-info>
				</template>
			</component>

			<drawer-batch
				v-model:active="batchEditActive"
				:primary-keys="selection"
				:collection="collection"
				@refresh="drawerBatchRefresh"
			/>

			<template #sidebar>
				<presets-info-sidebar-detail />
				<layout-sidebar-detail v-model="layout">
					<component :is="`layout-options-${layout || 'tabular'}`" v-bind="layoutState" />
				</layout-sidebar-detail>
				<component :is="`layout-sidebar-${layout || 'tabular'}`" v-bind="layoutState" />
				<refresh-sidebar-detail v-model="refreshInterval" @refresh="refresh" />
				<export-sidebar-detail :collection="collection" :filter="filter" :search="search" @refresh="refresh" />
			</template>

			<v-dialog :model-value="deleteError !== null">
				<v-card>
					<v-card-title>{{ $t('something_went_wrong') }}</v-card-title>
					<v-card-text>
						<v-error :error="deleteError" />
					</v-card-text>
					<v-card-actions>
						<v-button @click="deleteError = null">{{ $t('done') }}</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</private-view>
	</component>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color-disabled: var(--theme--primary-background);
	--v-button-color-disabled: var(--theme--primary);
	--v-button-background-color-hover-disabled: var(--theme--primary-subdued);
	--v-button-color-hover-disabled: var(--theme--primary);
}

.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}
</style>
