<script setup lang="ts">
import api from '@/api';
import { formatCollectionItemsCount } from '@/utils/format-collection-items-count';
import SearchInput from '@/views/private/components/search-input.vue';
import { EXTENSION_TYPES } from '@directus/extensions';
import { debounce } from 'lodash';
import { computed, ref, watch, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import DrawerExtension from './components/drawer-extension.vue';

const { t } = useI18n();

const liveSearch = ref('');

watch(
	liveSearch,
	debounce(() => {
		search.value = liveSearch.value;
	}, 450),
);

const perPage = 6;
const search = ref('');
const page = ref(1);
const type = ref<string>();

watch(search, ([newSearch, oldSearch]) => newSearch !== oldSearch && (page.value = 1));

const filterCount = ref(0);

const showingCount = computed(() => {
	return formatCollectionItemsCount(filterCount.value, page.value, perPage, !!search.value);
});

const extensions = ref([]);

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

		<template #actions>
			<transition name="fade">
				<span v-if="filterCount" class="item-count">
					{{ showingCount }}
				</span>
			</transition>

			<search-input v-model="liveSearch" :show-filter="false" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<!-- <extensions-info-sidebar-detail /> -->
		</template>

		<div class="page-container">
			<div class="buttons">
				<button @click="type = undefined">All</button>
				<button
					v-for="extType in EXTENSION_TYPES"
					:key="extType"
					@click="type = extType"
					:class="{ active: type === extType }"
				>
					{{ extType }}
				</button>
			</div>

			<v-list>
				<v-list-item v-for="extension in extensions" :key="extension.name" block clickable>
					<v-list-item-icon>
						<div class="icon"><v-icon name="storefront" /></div>
					</v-list-item-icon>
					<v-list-item-content>
						<p>{{ extension.name }}</p>
						<p>{{ extension.description }}</p>
					</v-list-item-content>
				</v-list-item>
			</v-list>

			<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount" :total-visible="5" />

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

.group-divider {
	margin-bottom: 12px;
}

.extension-group + .extension-group {
	margin-top: 24px;
}

/** @TODO improve by a lot */
.buttons {
	display: flex;
	gap: 1em;

	& .active {
		color: var(--theme--primary);
	}
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
</style>
