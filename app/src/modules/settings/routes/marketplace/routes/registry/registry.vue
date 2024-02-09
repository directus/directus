<script setup lang="ts">
import api from '@/api';
import VBanner from '@/components/v-banner.vue';
import type { RegistryListResponse } from '@directus/extensions-registry';
import { isEqual } from 'lodash';
import { computed, ref, watch, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../../../components/navigation.vue';
import ExtensionListItem from '../../components/extension-list-item.vue';
import InlineFilter from './components/inline-filter.vue';
import RegistryInfoSidebarDetail from './components/registry-info-sidebar-detail.vue';

const { t } = useI18n();

const perPage = 6;
const search = ref<string | null>(null);
const page = ref(1);
const type = ref<string | null>(null);
const sort = ref<'popular' | 'recent'>('popular');

watch([search, sort, type], (newVals, oldVals) => {
	if (isEqual(newVals, oldVals) === false) {
		page.value = 1;
	}
});

const filterCount = ref(0);

const extensions = ref<RegistryListResponse['data']>([]);
const pageCount = computed(() => Math.round(filterCount.value / perPage));
const loading = ref(false);
const error = ref<unknown>(null);

watchEffect(async () => {
	loading.value = true;

	try {
		error.value = null;

		const { data } = await api.get('/extensions/registry', {
			params: {
				search: search.value,
				limit: perPage,
				offset: (page.value - 1) * perPage,
				type: type.value,
				sort: sort.value,
			},
		});

		filterCount.value = data.meta.filter_count;
		extensions.value = data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
});
</script>

<template>
	<private-view :title="t('marketplace')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="storefront" />
			</v-button>
		</template>

		<template #title-outer:append>
			<v-chip class="beta" outlined small>Beta</v-chip>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<registry-info-sidebar-detail />
		</template>

		<div class="page-container">
			<VBanner icon="storefront">Marketplace</VBanner>

			<InlineFilter
				v-model:type="type"
				v-model:sort="sort"
				v-model:search="search"
				:page="page"
				:filter-count="filterCount"
				:per-page="perPage"
				class="filter"
			/>

			<v-list class="results">
				<ExtensionListItem v-for="extension in extensions" :key="extension.id" :extension="extension" />
			</v-list>

			<v-info v-if="extensions.length === 0 && !loading && !error" :title="t('no_results')" icon="extension">
				{{ t('no_results_copy') }}
			</v-info>

			<v-error v-if="error && !loading" :error="error" />

			<v-pagination v-if="pageCount > 1" v-model="page" class="pagination" :length="pageCount" :total-visible="5" />

			<router-view />
		</div>
	</private-view>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color-disabled: var(--theme--primary-background);
	--v-button-color-disabled: var(--theme--primary);
	--v-button-background-color-hover-disabled: var(--theme--primary-subdued);
	--v-button-color-hover-disabled: var(--theme--primary);
}

.page-container {
	padding: var(--content-padding);
	max-width: 1200px;
}

.extension-group + .extension-group {
	margin-top: 24px;
}

.beta {
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-subdued);
	margin-left: 10px;
}

.filter {
	margin-block-start: 24px;
	margin-block-end: 20px;
}

.results {
	padding-top: 0 !important; // 🤫
}

.pagination {
	margin-block-start: 20px;
}

.no-results {
	margin-block-start: 40px;
}
</style>
