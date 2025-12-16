<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { formatItemsCountPaginated } from '@/utils/format-items-count';
import { EXTENSION_TYPES } from '@directus/constants';
import { watchDebounced } from '@vueuse/core';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

const type = defineModel<string | null>('type');
const sort = defineModel<string | null>('sort');
const search = defineModel<string | null>('search');

const props = defineProps<{
	page: number;
	filterCount: number;
	perPage: number;
}>();

const searchInputValue = ref(search.value);

watchDebounced(
	searchInputValue,
	(val) => {
		if (val === search.value) return;

		if (val && val.length > 0) {
			search.value = val;
		} else {
			search.value = null;
		}
	},
	{ debounce: 300 },
);

const { t, n } = useI18n();
const { filterCount, page, perPage } = toRefs(props);

const showingCount = computed(() =>
	formatItemsCountPaginated({
		currentItems: filterCount.value,
		currentPage: page.value,
		perPage: perPage.value,
		isFiltered: !!search.value,
		i18n: { t, n },
	}),
);

const typeOptions = [
	{
		text: t('all'),
		value: null,
	},
	...EXTENSION_TYPES.map((type) => ({
		text: t(`extension_${type}s`),
		value: type,
	})),
];

const sortOptions = [
	{
		text: t('popular'),
		value: 'popular',
	},
	{
		text: t('recent'),
		value: 'recent',
	},
	{
		text: t('downloads'),
		value: 'downloads',
	},
];
</script>

<template>
	<div class="inline-filter">
		<div class="field">
			<v-icon class="icon" small name="category" />
			<v-select v-model="type" menu-full-height class="type" inline :items="typeOptions" />
		</div>

		<div class="field">
			<v-icon class="icon" small name="sort" />
			<v-select v-model="sort" class="sort" inline :items="sortOptions" />
		</div>

		<div class="field">
			<v-icon class="icon" small name="search" />
			<input v-model="searchInputValue" v-focus="true" :placeholder="$t('search_extensions')" class="search-input" />
		</div>

		<div v-show="filterCount !== 0" class="item-count">{{ showingCount }}</div>
	</div>
</template>

<style scoped>
.inline-filter {
	display: flex;
	gap: 4px 32px;
	flex-wrap: wrap;
	inline-size: 100%;
}

.search-input {
	appearance: none;
	border: none;
	border-radius: 0;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color);
	inline-size: 180px;
	background: transparent;

	&::placeholder {
		color: var(--theme--foreground-subdued);
	}
}

.item-count {
	margin-inline-start: auto;
	color: var(--theme--foreground-subdued);
}

.field {
	display: flex;
	align-items: center;
}

.icon {
	margin-inline-end: 4px;
}
</style>
