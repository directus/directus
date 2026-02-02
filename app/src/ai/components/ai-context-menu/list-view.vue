<script setup lang="ts" generic="T">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AiEmptyState from './empty-state.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';

const props = withDefaults(
	defineProps<{
		items: T[];
		itemKey: keyof T & string;
		emptyMessage?: string;
	}>(),
	{
		emptyMessage: undefined,
	},
);

defineSlots<{ item(props: { item: T }): unknown }>();

const { t } = useI18n();

const displayMessage = computed(() => props.emptyMessage ?? t('no_results'));
</script>

<template>
	<VList>
		<template v-if="items.length > 0">
			<VListItem v-for="item in items" :key="item[itemKey]">
				<slot name="item" :item="item" />
			</VListItem>
		</template>

		<AiEmptyState v-else :message="displayMessage" />
	</VList>
</template>
