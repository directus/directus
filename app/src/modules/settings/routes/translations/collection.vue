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
		<private-view
			:title="t('settings_translations')"
			:small-header="currentLayout?.smallHeader"
			:header-shadow="currentLayout?.headerShadow"
			:sidebar-shadow="currentLayout?.sidebarShadow"
		>
			<template #title-outer:prepend>
				<v-button class="header-icon" rounded icon exact disabled>
					<v-icon name="translate" />
				</v-button>
			</template>

			<template #headline>
				<v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" />
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout || 'tabular'}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<search-input v-model="search" v-model:filter="filter" collection="directus_translations" />

				<v-dialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false">
					<template #activator="{ on }">
						<v-button v-tooltip.bottom="t('delete_label')" rounded icon class="action-delete" secondary @click="on">
							<v-icon name="delete" outline />
						</v-button>
					</template>

					<v-card>
						<v-card-title>{{ t('batch_delete_confirm', selection.length) }}</v-card-title>

						<v-card-actions>
							<v-button secondary @click="confirmDelete = false">
								{{ t('cancel') }}
							</v-button>
							<v-button kind="danger" :loading="deleting" @click="batchDelete">
								{{ t('delete_label') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-button
					v-if="selection.length > 0"
					v-tooltip.bottom="t('edit')"
					rounded
					icon
					secondary
					@click="batchEditActive = true"
				>
					<v-icon name="edit" outline />
				</v-button>

				<v-button v-tooltip.bottom="t('create_custom_translation')" rounded icon :to="addNewLink">
					<v-icon name="add" />
				</v-button>
			</template>

			<template #navigation>
				<settings-navigation />
			</template>

			<component :is="`layout-${layout || 'tabular'}`" v-bind="layoutState">
				<template #no-results>
					<v-info :title="t('no_results')" icon="search" center>
						{{ t('no_results_copy') }}

						<template #append>
							<v-button @click="clearFilters">{{ t('clear_filters') }}</v-button>
						</template>
					</v-info>
				</template>

				<template #no-items>
					<v-info :title="t('no_custom_translations')" :icon="currentCollection!.icon" center>
						{{ t('no_custom_translations_copy') }}

						<template #append>
							<v-button :to="`/settings/translations/+`">{{ t('create_custom_translation') }}</v-button>
						</template>
					</v-info>
				</template>
			</component>

			<drawer-batch
				v-model:active="batchEditActive"
				:primary-keys="selection"
				collection="directus_translations"
				@refresh="batchRefresh"
			/>

			<template #sidebar>
				<sidebar-detail icon="info" :title="t('information')" close>
					<div v-md="t('page_help_settings_translations_collection')" class="page-description" />
				</sidebar-detail>
				<layout-sidebar-detail v-model="layout">
					<component :is="`layout-options-${layout || 'tabular'}`" v-bind="layoutState" />
				</layout-sidebar-detail>
				<component :is="`layout-sidebar-${layout || 'tabular'}`" v-bind="layoutState" />
				<refresh-sidebar-detail v-model="refreshInterval" @refresh="refresh" />
				<export-sidebar-detail
					collection="directus_translations"
					:filter="filter"
					:search="search"
					:layout-query="layoutQuery"
					@download="download"
					@refresh="refresh"
				/>
				<flow-sidebar-detail
					location="collection"
					collection="directus_translations"
					:selection="selection"
					@refresh="batchRefresh"
				/>
			</template>

			<v-dialog :model-value="deleteError !== null">
				<v-card>
					<v-card-title>{{ t('something_went_wrong') }}</v-card-title>
					<v-card-text>
						<v-error :error="deleteError" />
					</v-card-text>
					<v-card-actions>
						<v-button @click="deleteError = null">{{ t('done') }}</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</private-view>
	</component>
</template>

<script setup lang="ts">
import api from '@/api';
import { useExtension } from '@/composables/use-extension';
import { usePreset } from '@/composables/use-preset';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import ExportSidebarDetail from '@/views/private/components/export-sidebar-detail.vue';
import FlowSidebarDetail from '@/views/private/components/flow-sidebar-detail.vue';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { useCollection, useLayout } from '@directus/composables';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';

type Item = {
	[field: string]: any;
};

const props = defineProps<{
	bookmark?: string;
	archive?: string;
}>();

const { t } = useI18n();

const layoutRef = ref();

const bookmarkID = computed(() => (props.bookmark ? +props.bookmark : null));

const selection = ref<Item[]>([]);
const { info: currentCollection } = useCollection('directus_translations');

const addNewLink = computed<string>(() => {
	return `/settings/translations/+`;
});

const { layout, layoutOptions, layoutQuery, filter, search, resetPreset, refreshInterval } = usePreset(
	ref('directus_translations'),
	bookmarkID
);

const { layoutWrapper } = useLayout(layout);

const { confirmDelete, deleting, batchDelete, error: deleteError, batchEditActive } = useBatch();

const currentLayout = useExtension('layout', layout);

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

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}
</style>
