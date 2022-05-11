<template>
	<component
		:is="to ? 'router-link' : 'button'"
		class="sidebar-button"
		:class="{ active }"
		@click="$emit('click', $event)"
	>
		<div class="icon">
			<v-icon :name="icon" />
		</div>
		<div v-if="sidebarOpen" class="title">
			<slot />
		</div>
	</component>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import { useAppStore } from '@/stores';

export default defineComponent({
	props: {
		to: {
			type: String,
			default: null,
		},
		icon: {
			type: String,
			default: 'box',
		},
		active: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	setup() {
		const appStore = useAppStore();
		const { sidebarOpen } = toRefs(appStore);

		return { sidebarOpen };
	},
});
</script>

<style lang="scss" scoped>
.sidebar-button {
	position: relative;
	flex-shrink: 0;
	width: 100%;
	height: 60px;
	color: var(--g-color-foreground-accent);
	background-color: var(--g-color-background-accent);

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
		background-color: var(--g-color-background-accent);
	}
}
</style>
