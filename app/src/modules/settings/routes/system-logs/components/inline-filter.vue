<script setup lang="ts">
import { watchDebounced } from '@vueuse/core';
import { computed, ref } from 'vue';

const type = defineModel<string[] | null>('type');
const sort = defineModel<string[] | null>('sort');
const search = defineModel<string | null>('search');

const props = defineProps<{
	allowedLogLevelNames: string[];
	instances: string[];
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
	{ debounce: 100 },
);

const typeOptions = computed(() => {
	return props.allowedLogLevelNames.map((logLevel) => ({
		text: logLevel.toLocaleUpperCase(),
		value: logLevel,
	}));
});

const sortOptions = computed(() => {
	return props.instances.map((nodeId, index) => ({
		text: `Instance ${index + 1}`,
		value: nodeId,
	}));
});
</script>

<template>
	<div class="inline-filter">
		<div class="field">
			<v-icon class="icon" small name="filter_list" />
			<v-select
				v-model="type"
				menu-full-height
				class="type"
				all-items-translation="all_log_levels"
				item-count-translation="log_level_count"
				multiple
				inline
				show-deselect
				:items="typeOptions"
			/>
		</div>

		<div class="field">
			<v-icon class="icon" small name="grid_3x3" />
			<v-select
				v-model="sort"
				class="sort"
				all-items-translation="all_instances"
				item-count-translation="instance_count"
				multiple
				inline
				show-deselect
				:items="sortOptions"
			/>
		</div>

		<div class="field">
			<v-icon class="icon" small name="search" />
			<input v-model="searchInputValue" v-focus="true" :placeholder="$t('search_logs')" class="search-input" />
		</div>
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
