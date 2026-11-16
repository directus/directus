<script setup lang="ts">
import VIcon from '../v-icon/v-icon.vue';
import type { ChoiceCardItem } from './types';

defineProps<{
	item: ChoiceCardItem;
	labelId: string;
	descriptionId: string;
}>();
</script>

<template>
	<div v-if="item.icon" class="icon-box">
		<VIcon :name="item.icon" />
	</div>
	<div class="text">
		<p v-if="item.label" :id="labelId" class="label type-text-bold">{{ item.label }}</p>
		<p v-if="item.description" :id="descriptionId" class="description type-text">{{ item.description }}</p>
	</div>
</template>

<style lang="scss" scoped>
.icon-box {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 2.75rem;
	block-size: 2.75rem;
	background-color: var(--choice-card-icon-background, var(--theme--background-subdued));
	border-radius: 0.75rem;
	margin-block-end: 0.25rem;
	transition-property: background-color;
	transition-duration: var(--fast);
	transition-timing-function: var(--transition);

	.v-icon {
		--v-icon-color: var(--choice-card-foreground, var(--theme--foreground-subdued));
	}
}

.text {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.label {
	color: var(--choice-card-foreground, var(--theme--foreground));
	font-weight: 600;
}

.description {
	color: var(--choice-card-description-color, var(--theme--foreground-subdued));
}
</style>
