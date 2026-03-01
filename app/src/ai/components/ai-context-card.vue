<script setup lang="ts">
import type { ContextAttachment } from '@directus/ai';
import { computed } from 'vue';
import type { PendingContextItem } from '../types';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useCollectionsStore } from '@/stores/collections';

type ContextItem = ContextAttachment | PendingContextItem;

const props = withDefaults(
	defineProps<{
		item: ContextItem;
		removable?: boolean;
	}>(),
	{
		removable: false,
	},
);

const emit = defineEmits<{
	remove: [];
	mouseenter: [];
	mouseleave: [];
}>();

const collectionsStore = useCollectionsStore();

const icon = computed(() => {
	switch (props.item.type) {
		case 'visual-element': {
			const collection = collectionsStore.getCollection(props.item.data.collection);
			return collection?.icon || 'view_in_ar';
		}

		case 'item': {
			const collection = collectionsStore.getCollection(props.item.data.collection);
			return collection?.icon || 'database';
		}

		case 'prompt':
			return 'magic_button';

		default:
			return 'attachment';
	}
});
</script>

<template>
	<div class="ai-context-card" :class="{ removable }" @mouseenter="emit('mouseenter')" @mouseleave="emit('mouseleave')">
		<div class="icon-wrapper">
			<VIcon :name="icon" x-small class="item-icon" />
		</div>
		<VTextOverflow :text="String(item.display)" class="display-text" />
		<button v-if="removable" type="button" class="close-button" :aria-label="$t('remove')" @click.stop="emit('remove')">
			<VIcon name="close" small />
		</button>
	</div>
</template>

<style scoped>
.ai-context-card {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 6px;
	flex: 0 0 auto;
	max-inline-size: 150px;
	background-color: var(--theme--background);
	border: 1px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);

	&.removable {
		max-inline-size: 125px;
		cursor: pointer;
		transition:
			border-color var(--fast) var(--transition),
			background-color var(--fast) var(--transition);

		&:hover {
			border-color: var(--theme--border-color-accent);
			background-color: var(--theme--background-normal);
		}
	}
}

.icon-wrapper {
	flex-shrink: 0;
	background-color: var(--theme--primary-background);
	padding: 2px;
	border-radius: var(--theme--border-radius);
	display: flex;
	align-items: center;
	justify-content: center;
}

.item-icon {
	--v-icon-color: var(--purple);
}

.display-text {
	flex: 1;
	min-inline-size: 0;
	font-size: 12px;
	font-weight: 500;
	color: var(--theme--foreground);
	line-height: 1.3;
	margin: 0;
}

.close-button {
	all: unset;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2px;
	border-radius: 4px;
	cursor: pointer;
	opacity: 0.5;
	flex-shrink: 0;
	transition:
		opacity var(--fast) var(--transition),
		background-color var(--fast) var(--transition);

	--v-icon-color: var(--theme--foreground);

	&:hover {
		opacity: 1;
		background-color: var(--theme--background-normal);
	}

	&:focus-visible {
		opacity: 1;
		outline: 2px solid var(--theme--primary);
		outline-offset: 1px;
	}
}
</style>
