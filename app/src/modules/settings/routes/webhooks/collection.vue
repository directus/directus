<script setup lang="ts">
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VNotice from '@/components/v-notice.vue';
import { usePreset } from '@/composables/use-preset';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { PrivateView } from '@/views/private';
import { useLayout } from '@directus/composables';
import { ref } from 'vue';
import SettingsNavigation from '../../components/navigation.vue';

type Item = {
	[field: string]: any;
};

const layoutRef = ref();
const selection = ref<Item[]>([]);

const { layout, layoutOptions, layoutQuery, filter, search } = usePreset(ref('directus_webhooks'));
const { confirmDelete, deleting, batchDelete } = useBatchDelete();

const { layoutWrapper } = useLayout(layout);

async function refresh() {
	await layoutRef.value?.state?.refresh?.();
}

function useBatchDelete() {
	const confirmDelete = ref(false);
	const deleting = ref(false);

	return { confirmDelete, deleting, batchDelete };

	async function batchDelete() {
		if (deleting.value) return;

		deleting.value = true;

		confirmDelete.value = false;

		const batchPrimaryKeys = selection.value;

		await api.delete(`/webhooks`, {
			data: batchPrimaryKeys,
		});

		await refresh();

		selection.value = [];
		deleting.value = false;
		confirmDelete.value = false;
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
		:filter="filter"
		:search="search"
		collection="directus_webhooks"
	>
		<PrivateView :title="$t('webhooks')" icon="anchor">
			<template #headline><VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>

			<template #navigation>
				<SettingsNavigation />
			</template>

			<template #actions>
				<SearchInput v-model="search" collection="directus_webhooks" small />

				<VDialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false" @apply="batchDelete">
					<template #activator="{ on }">
						<VButton rounded icon class="action-delete" secondary small @click="on">
							<VIcon name="delete" small />
						</VButton>
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
			</template>

			<div class="deprecation-notice-wrapper">
				<VNotice type="danger">
					<span v-md="{ value: $t('webhooks_deprecation_notice'), target: '_blank' }"></span>
				</VNotice>
			</div>

			<component :is="`layout-${layout}`" v-bind="layoutState">
				<template #no-results>
					<VInfo :title="$t('no_results')" icon="search" center>
						{{ $t('no_results_copy') }}

						<template #append>
							<VButton @click="clearFilters">{{ $t('clear_filters') }}</VButton>
						</template>
					</VInfo>
				</template>

				<template #no-items>
					<VInfo :title="$t('webhooks_count', 0)" icon="anchor" center>
						{{ $t('no_webhooks_copy') }}
					</VInfo>
				</template>
			</component>

			<template #sidebar>
				<LayoutSidebarDetail v-model="layout">
					<component :is="`layout-options-${layout}`" v-bind="layoutState" />
				</LayoutSidebarDetail>
				<component :is="`layout-sidebar-${layout}`" v-bind="layoutState" />
			</template>
		</PrivateView>
	</component>
</template>

<style lang="scss" scoped>
.deprecation-notice-wrapper {
	padding: var(--content-padding);
	inline-size: fit-content;
	:deep(a) {
		text-decoration: underline;
	}
}

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

.layout {
	--layout-offset-top: 64px;
}
</style>
