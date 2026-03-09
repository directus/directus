<script setup lang="ts">
import { formatTitle } from '@directus/format-title';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import CommandPaletteEmpty from '../../command-palette-empty.vue';
import CommandPaletteItem from '../../command-palette-item.vue';
import CommandPaletteList from '../../command-palette-list.vue';
import { useCommandPalette } from '../../composables/use-command-palette';
import { commandScore } from '../../composables/use-command-score';
import { useCollectionsStore } from '@/stores/collections';

const { t } = useI18n();
const router = useRouter();
const collectionsStore = useCollectionsStore();
const { search, close } = useCommandPalette();

const collections = computed(() =>
	collectionsStore.allCollections
		.filter(({ type }) => type !== 'alias')
		.map(({ collection, meta }) => ({
			id: collection,
			name: formatTitle(collection),
			icon: (meta?.icon ?? 'box') as string,
		})),
);

const filtered = computed(() => {
	if (!search.value) return collections.value;

	return collections.value
		.map((col) => ({ col, score: commandScore(col.name, search.value, []) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.map(({ col }) => col);
});

const isEmpty = computed(() => !!search.value && filtered.value.length === 0);

function goToDataModel() {
	router.push('/settings/data-model');
	close();
}

function selectCollection(id: string) {
	router.push(`/settings/data-model/${id}`);
	close();
}
</script>

<template>
	<CommandPaletteList :search-bar-placeholder="t('settings_data_model') + '...'">
		<CommandPaletteItem v-if="!search" value="go-to-data-model" icon="arrow_forward" @select="goToDataModel">
			{{ t('settings_data_model') }}
		</CommandPaletteItem>
		<CommandPaletteEmpty :show="isEmpty" />
		<CommandPaletteItem
			v-for="col in filtered"
			:key="col.id"
			:value="col.id"
			:icon="col.icon"
			@select="selectCollection(col.id)"
		>
			{{ col.name }}
		</CommandPaletteItem>
	</CommandPaletteList>
</template>
