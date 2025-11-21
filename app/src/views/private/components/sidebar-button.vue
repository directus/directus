<script setup lang="ts">
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';

const sidebarStore = useSidebarStore();

withDefaults(
	defineProps<{
		to?: string;
		icon?: string;
		active?: boolean;
	}>(),
	{
		icon: 'box',
	},
);

defineEmits<{
	(e: 'click', event: MouseEvent): void;
}>();
</script>

<template>
	<component
		:is="to ? 'router-link' : 'button'"
		:aria-expanded="to ? undefined : active"
		class="sidebar-button"
		:class="{ active }"
		@click="$emit('click', $event)"
	>
		<div class="icon">
			<v-icon :name="icon!" />
		</div>
		<div v-if="!sidebarStore.collapsed" class="title">
			<slot />
		</div>
	</component>
</template>

<style lang="scss" scoped>
.sidebar-button {
	--focus-ring-offset: var(--focus-ring-offset-inset);

	position: relative;
	flex-shrink: 0;
	inline-size: 100%;
	block-size: 60px;
	color: var(--theme--foreground-accent);
	background-color: var(--theme--background-accent);

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		inline-size: 60px;
		block-size: 100%;
	}

	.title {
		position: absolute;
		inset-block-start: 50%;
		inset-inline-start: 52px;
		overflow: hidden;
		white-space: nowrap;
		transform: translateY(-50%);
	}

	&.active {
		background-color: var(--theme--background-accent);
	}
}
</style>
