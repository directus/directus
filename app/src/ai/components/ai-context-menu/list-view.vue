<script setup lang="ts">
import AiEmptyState from './empty-state.vue';
import VList from '@/components/v-list.vue';

withDefaults(
	defineProps<{
		items: Record<string, any>[];
		itemKey?: string;
		emptyMessage?: string;
	}>(),
	{
		itemKey: 'id',
		emptyMessage: 'No results',
	},
);
</script>

<template>
	<VList>
		<template v-if="items.length > 0">
			<slot v-for="item in items" :key="item[itemKey]" name="item" :item="item" />
		</template>

		<AiEmptyState v-else :message="emptyMessage" />
	</VList>
</template>
