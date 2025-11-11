<script setup lang="ts">
import api from '@/api';
import VBanner from '@/components/v-banner.vue';
import type { RegistryListResponse } from '@directus/extensions-registry';
import { useRouteQuery } from '@vueuse/router';
import { isEqual } from 'lodash';
import { computed, ref, watch, watchEffect } from 'vue';
import SettingsNavigation from '../../../../components/navigation.vue';
import ExtensionListItem from '../../components/extension-list-item.vue';
import InlineFilter from './components/inline-filter.vue';
import RegistryInfoSidebarDetail from './components/registry-info-sidebar-detail.vue';


const perPage = 10;

const page = useRouteQuery('page', 1, {
	transform: (value) => Number(Array.isArray(value) ? value[0] : value) || 1,
});

const search = useRouteQuery<string | null>('search', null, {
	transform: (value) => (Array.isArray(value) ? value[0] : value),
});

const type = useRouteQuery<string | null>('type', null, {
	transform: (value) => (Array.isArray(value) ? value[0] : value),
});

const sort = useRouteQuery<'popular' | 'recent' | 'downloads'>('sort', 'popular');

watch([search, sort, type], (newVal, oldVal) => {
	if (isEqual(newVal, oldVal) === false) {
		page.value = 1;
	}
});

const filterCount = ref(0);

const extensions = ref<RegistryListResponse['data'] | null>(null);
const pageCount = computed(() => Math.ceil(filterCount.value / perPage));
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
				filter: {
					type: {
						_eq: type.value,
					},
				},
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
	<private-view :title="$t('marketplace')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="storefront" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<registry-info-sidebar-detail />
		</template>

		<div class="page-container">
			<VBanner icon="storefront" hide-avatar-background>
				<template #avatar>
					<svg width="128" height="106" viewBox="0 0 128 106" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M1.82945 45.9964C-0.609818 43.5571 -0.609817 39.6023 1.82945 37.163L37.163 1.82945C39.6022 -0.609817 43.5571 -0.609818 45.9964 1.82945L103.413 59.2464C105.853 61.6857 105.853 65.6406 103.413 68.0798L68.0798 103.413C65.6405 105.853 61.6857 105.853 59.2464 103.413L1.82945 45.9964Z"
							fill="var(--theme--primary-background)"
						/>
						<path
							d="M82.0036 2.2733C84.4429 -0.165967 88.3977 -0.165967 90.837 2.2733L126.171 37.6068C128.61 40.0461 128.61 44.001 126.171 46.4402L68.7536 103.857C66.3143 106.296 62.3594 106.296 59.9202 103.857L24.5866 68.5237C22.1474 66.0844 22.1474 62.1296 24.5866 59.6903L82.0036 2.2733Z"
							fill="var(--theme--primary)"
						/>
					</svg>
				</template>
				{{ $t('marketplace') }}
			</VBanner>

			<InlineFilter
				v-model:type="type"
				v-model:sort="sort"
				v-model:search="search"
				:page="page"
				:filter-count="filterCount"
				:per-page="perPage"
				class="filter"
			/>

			<v-error v-if="error && !loading" :error="error" />

			<v-progress-circular v-if="!error && extensions === null && loading" class="spinner" indeterminate />

			<v-list v-if="!error && extensions !== null" class="results" :class="{ loading }">
				<ExtensionListItem
					v-for="extension in extensions"
					:key="extension.id"
					:extension="extension"
					:show-type="!type"
				/>
			</v-list>

			<v-info
				v-if="extensions?.length === 0 && !loading && !error"
				:title="$t('no_results')"
				class="no-results"
				icon="extension"
			>
				{{ $t('no_results_copy') }}
			</v-info>

			<v-pagination
				v-if="pageCount > 1"
				v-model="page"
				class="pagination"
				:length="pageCount"
				:total-visible="5"
				show-first-last
			/>

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
	padding-block-start: 0;
	max-inline-size: 1200px;
}

.extension-group + .extension-group {
	margin-block-start: 24px;
}

.filter {
	margin-block: 24px 20px;
}

.results {
	padding-block-start: 0 !important; // 🤫
	opacity: 1;
	transition: opacity var(--fast) var(--transition);

	&.loading {
		opacity: 0.5;
	}
}

.pagination {
	margin-block-start: 20px;
}

.no-results {
	margin-block-start: 120px;
}

.spinner {
	margin: 120px auto;
}
</style>
