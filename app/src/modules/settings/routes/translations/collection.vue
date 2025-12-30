<script setup lang="ts">
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VError from '@/components/v-error.vue';
import VInfo from '@/components/v-info.vue';
import { usePreset } from '@/composables/use-preset';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import ExportSidebarDetail from '@/views/private/components/export-sidebar-detail.vue';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import { useCollection, useLayout } from '@directus/composables';
import { computed, ref } from 'vue';
import SettingsNavigation from '../../components/navigation.vue';

type Item = {
	[field: string]: any;
};

const props = defineProps<{
	bookmark?: string;
	archive?: string;
}>();

const layoutRef = ref();

const bookmarkID = computed(() => (props.bookmark ? +props.bookmark : null));

const selection = ref<Item[]>([]);
const { info: currentCollection } = useCollection('directus_translations');

const addNewLink = computed<string>(() => {
	return `/settings/translations/+`;
});

const { layout, layoutOptions, layoutQuery, filter, search, resetPreset, refreshInterval } = usePreset(
	ref('directus_translations'),
	bookmarkID,
);

const { layoutWrapper } = useLayout(layout);

const { confirmDelete, deleting, batchDelete, error: deleteError, batchEditActive } = useBatch();

async function refresh() {
	await layoutRef.value?.state?.refresh?.();
}

async function download() {
	await layoutRef.value?.state?.download?.();
}

async function batchRefresh() {
	selection.value = [];
	await refresh();
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

		const batchPrimaryKeys = selection.value;

		try {
			await api.delete(`/translations`, {
				data: batchPrimaryKeys,
			});

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
		ref="layoutRef"
		v-slot="{ layoutState }"
		v-model:selection="selection"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:filter-user="filter"
		:filter="filter"
		:search="search"
		collection="directus_translations"
		:reset-preset="resetPreset"
		:clear-filters="clearFilters"
	>
		<PrivateView :title="$t('settings_translations')" icon="translate">
			<template #headline>
				<VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" />
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout || 'tabular'}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<SearchInput v-model="search" v-model:filter="filter" collection="directus_translations" small />

				<VDialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false" @apply="batchDelete">
					<template #activator="{ on }">
						<PrivateViewHeaderBarActionButton
							v-tooltip.bottom="$t('delete_label')"
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
					v-tooltip.bottom="$t('edit')"
					icon="edit"
					secondary
					@click="batchEditActive = true"
				/>

				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('create_custom_translation')"
					:to="addNewLink"
					icon="add"
				/>
			</template>

			<template #navigation>
				<SettingsNavigation />
			</template>

			<component :is="`layout-${layout || 'tabular'}`" v-bind="layoutState">
				<template #no-results>
					<VInfo :title="$t('no_results')" icon="search" center>
						{{ $t('no_results_copy') }}

						<template #append>
							<VButton @click="clearFilters">{{ $t('clear_filters') }}</VButton>
						</template>
					</VInfo>
				</template>

				<template #no-items>
					<VInfo :title="$t('no_custom_translations')" :icon="currentCollection!.icon" center>
						{{ $t('no_custom_translations_copy') }}

						<template #append>
							<VButton :to="`/settings/translations/+`">{{ $t('create_custom_translation') }}</VButton>
						</template>
					</VInfo>
				</template>
			</component>

			<DrawerBatch
				v-model:active="batchEditActive"
				:primary-keys="selection"
				collection="directus_translations"
				@refresh="batchRefresh"
			/>

			<template #sidebar>
				<LayoutSidebarDetail v-model="layout">
					<component :is="`layout-options-${layout || 'tabular'}`" v-bind="layoutState" />
				</LayoutSidebarDetail>
				<component :is="`layout-sidebar-${layout || 'tabular'}`" v-bind="layoutState" />
				<RefreshSidebarDetail v-model="refreshInterval" @refresh="refresh" />
				<ExportSidebarDetail
					collection="directus_translations"
					:filter="filter"
					:search="search"
					:layout-query="layoutQuery"
					@download="download"
					@refresh="refresh"
				/>
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
.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon {
	--v-button-color-disabled: var(--theme--foreground);
}
</style>
