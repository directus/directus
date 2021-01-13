<template>
	<component
		class="sidebar-button"
		:is="to ? 'router-link' : 'button'"
		:class="{ active }"
		@click="$emit('click', $event)"
	>
		<div class="icon">
			<v-icon :name="icon" outline />
		</div>
		<div class="title" v-if="sidebarOpen">
			<slot />
		</div>
	</component>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
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
	setup() {
		const appStore = useAppStore();
		const { sidebarOpen } = toRefs(appStore.state);

		return { sidebarOpen };
	},
});
</script>

<style lang="scss" scoped>
.sidebar-button {
	position: relative;
	flex-shrink: 0;
	width: 100%;
	height: 64px;
	color: var(--foreground-normal-alt);
	background-color: var(--background-normal-alt);

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
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
