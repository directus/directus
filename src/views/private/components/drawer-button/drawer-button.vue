<template>
	<component
		class="drawer-button"
		:is="to ? 'router-link' : 'button'"
		@click="$emit('click', $event)"
	>
		<div class="icon">
			<v-icon :name="icon" />
		</div>
		<div class="title" v-if="drawerOpen">
			<slot />
		</div>
	</component>
</template>

<script lang="ts">
import { defineComponent, inject, ref } from '@vue/composition-api';

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
	},
	setup() {
		const drawerOpen = inject('drawer-open', ref(false));

		return { drawerOpen };
	},
});
</script>

<style lang="scss" scoped>
.drawer-button {
	position: relative;
	width: 100%;
	height: 64px;
	color: var(--foreground-normal);
	transition: background-color var(--fast) var(--transition);

	&:hover {
		background-color: var(--background-normal-alt);
	}

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

	.fade-enter-active,
	.fade-leave-active {
		transition: opacity var(--medium) var(--transition);
	}
	.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
		opacity: 0;
	}
}
</style>
