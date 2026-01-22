<script setup lang="ts" generic="T">
import AiEmptyState from './empty-state.vue';
import VList from '@/components/v-list.vue';

withDefaults(
	defineProps<{
		items: T[];
		itemKey: keyof T & string;
		emptyMessage?: string;
	}>(),
	{
		emptyMessage: 'No results',
	},
);

defineSlots<{ item(props: { item: T }): unknown }>();
</script>

<template>
	<VList>
		<template v-if="items.length > 0">
			<template v-for="(item, index) in items" :key="item[itemKey] ?? index">
				<slot name="item" :item="item" />
			</template>
		</template>

		<AiEmptyState v-else :message="emptyMessage" />
	</VList>
</template>
