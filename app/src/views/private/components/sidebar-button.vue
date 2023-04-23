<template>
	<component
		:is="to ? 'router-link' : 'button'"
		class="sidebar-button"
		:class="{ active }"
		@click="$emit('click', $event)"
	>
		<div class="icon">
			<v-icon :name="icon!" />
		</div>
		<div v-if="sidebarOpen" class="title">
			<slot />
		</div>
	</component>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { useAppStore } from '@/stores/app';

withDefaults(
	defineProps<{
		to?: string;
		icon?: string;
		active?: boolean;
	}>(),
	{
		icon: 'box',
	}
);

defineEmits<{
	(e: 'click', event: MouseEvent): void;
}>();

const appStore = useAppStore();
const { sidebarOpen } = toRefs(appStore);
</script>

<style lang="scss" scoped>
.sidebar-button {
	position: relative;
	flex-shrink: 0;
	width: 100%;
	height: 60px;
	color: var(--foreground-normal-alt);
	background-color: var(--background-normal-alt);

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60px;
		height: 100%;
	}

	.title {
		position: absolute;
		top: 50%;
		left: 52px;
		overflow: hidden;
		white-space: nowrap;
		transform: translateY(-50%);
	}

	&.active {
		background-color: var(--background-normal-alt);
	}
}
</style>
