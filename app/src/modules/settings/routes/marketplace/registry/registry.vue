<script setup lang="ts">
import api from '@/api';
import VBanner from '@/components/v-banner.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import type { RegistryListResponse } from '@directus/extensions-registry';
import { debounce } from 'lodash';
import { computed, ref, watch, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../../components/navigation.vue';
import ExtensionListItem from './components/extension-list-item.vue';
import TypeFilter from './components/type-filter.vue';

const { t, n } = useI18n();

const liveSearch = ref<string | null>(null);

watch(
	liveSearch,
	debounce(() => {
		search.value = liveSearch.value;
	}, 450),
);

const perPage = 6;
const search = ref<string | null>(null);
const page = ref(1);
const type = ref<string | null>(null);

watch(search, (newSearch, oldSearch) => newSearch !== oldSearch && (page.value = 1));

const filterCount = ref(0);

const showingCount = computed(() => {
	const opts = {
		start: n((+page.value - 1) * perPage + 1),
		end: n(Math.min(page.value * perPage, filterCount.value || 0)),
		count: n(filterCount.value || 0),
	};

	if (search.value) {
		if (filterCount.value === 1) {
			return t('one_filtered_item');
		}

		return t('start_end_of_count_filtered_items', opts);
	}

	if (filterCount.value > perPage) {
		return t('start_end_of_count_items', opts);
	}

	return t('item_count', { count: filterCount.value });
});

const extensions = ref<RegistryListResponse['data']>([]);

const pageCount = computed(() => Math.round(filterCount.value / perPage));

watchEffect(async () => {
	const { data } = await api.get('/extensions/registry', {
		params: {
			search: search.value,
			limit: perPage,
			offset: (page.value - 1) * perPage,
			type: type.value,
		},
	});

	filterCount.value = data.meta.filter_count;
	extensions.value = data.data;
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

		<template #actions:prepend>
			<transition name="fade">
				<span v-if="filterCount" class="item-count">
					{{ showingCount }}
				</span>
			</transition>
		</template>

		<template #actions>
			<search-input v-model="liveSearch" :show-filter="false" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<!-- <extensions-info-sidebar-detail /> -->
		</template>

		<div class="page-container">
			<VBanner icon="storefront">Marketplace</VBanner>

			<TypeFilter v-model="type" class="filter" />

			<v-list>
				<ExtensionListItem v-for="extension in extensions" :key="extension.id" :extension="extension" />
			</v-list>

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
	padding-top: 0;
}

.extension-group + .extension-group {
	margin-top: 24px;
}

.item-count {
	position: relative;
	display: none;
	margin: 0 8px;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;

	@media (min-width: 600px) {
		display: inline;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.beta {
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-subdued);
	margin-left: 10px;
}

.filter {
	margin-block: 40px;
}

.pagination {
	margin-block-start: 20px;
}
</style>
