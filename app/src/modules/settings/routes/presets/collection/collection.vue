<script setup lang="ts">
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VError from '@/components/v-error.vue';
import VInfo from '@/components/v-info.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { usePreset } from '@/composables/use-preset';
import { usePresetsStore } from '@/stores/presets';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import ExportSidebarDetail from '@/views/private/components/export-sidebar-detail.vue';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
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
		<PrivateView :title="$t('settings_presets')" icon="bookmark">
			<template #headline>
				<VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" />
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout || 'tabular'}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<SearchInput v-model="search" v-model:filter="filter" :collection="collection" small />

				<VDialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false" @apply="batchDelete">
					<template #activator="{ on }">
						<PrivateViewHeaderBarActionButton
							v-tooltip.bottom="batchDeleteAllowed ? $t('delete_label') : $t('not_allowed')"
							:disabled="batchDeleteAllowed !== true"
							class="action-delete"
							secondary
							icon="delete"
							@click="on"
						/>
					</template>

					<VCard>
						<VCardTitle>{{ $t('batch_delete_confirm', selection.length) }}</VCardTitle>

						<VCardActions>
							<VButton secondary @click="confirmDelete = false">
								{{ $t('cancel') }}
							</VButton>
							<VButton kind="danger" :loading="deleting" @click="batchDelete">
								{{ $t('delete_label') }}
							</VButton>
						</VCardActions>
					</VCard>
				</VDialog>

				<PrivateViewHeaderBarActionButton
					v-if="selection.length > 0"
					v-tooltip.bottom="batchEditAllowed ? $t('edit') : $t('not_allowed')"
					secondary
					:disabled="batchEditAllowed === false"
					icon="edit"
					@click="batchEditActive = true"
				/>

				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="createAllowed ? $t('create_preset') : $t('not_allowed')"
					to="/settings/presets/+"
					:disabled="createAllowed === false"
					icon="add"
				/>
			</template>

			<template #navigation>
				<SettingsNavigation />
			</template>

			<component :is="`layout-${layout || 'tabular'}`" v-bind="layoutState">
				<template #no-results>
					<VInfo :title="$t('no_results')" icon="bookmark" center>
						{{ $t('no_results_copy') }}

						<template #append>
							<VButton @click="clearFilters">{{ $t('clear_filters') }}</VButton>
						</template>
					</VInfo>
				</template>

				<template #no-items>
					<VInfo :title="$t('no_presets')" icon="bookmark" center>
						{{ $t('no_presets_copy') }}

						<template v-if="createAllowed" #append>
							<VButton :to="`/settings/presets/+`">{{ $t('create_preset') }}</VButton>
						</template>
					</VInfo>
				</template>
			</component>

			<DrawerBatch
				v-model:active="batchEditActive"
				:primary-keys="selection"
				:collection="collection"
				@refresh="drawerBatchRefresh"
			/>

			<template #sidebar>
				<PresetsInfoSidebarDetail />
				<LayoutSidebarDetail v-model="layout">
					<component :is="`layout-options-${layout || 'tabular'}`" v-bind="layoutState" />
				</LayoutSidebarDetail>
				<component :is="`layout-sidebar-${layout || 'tabular'}`" v-bind="layoutState" />
				<RefreshSidebarDetail v-model="refreshInterval" @refresh="refresh" />
				<ExportSidebarDetail :collection="collection" :filter="filter" :search="search" @refresh="refresh" />
			</template>

			<VDialog :model-value="deleteError !== null">
				<VCard>
					<VCardTitle>{{ $t('something_went_wrong') }}</VCardTitle>
					<VCardText>
						<VError :error="deleteError" />
					</VCardText>
					<VCardActions>
						<VButton @click="deleteError = null">{{ $t('done') }}</VButton>
					</VCardActions>
				</VCard>
			</VDialog>
		</PrivateView>
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
