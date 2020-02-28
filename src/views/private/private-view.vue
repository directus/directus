<template>
	<div class="private-view">
		<aside class="navigation" :class="{ 'is-open': navOpen }">
			<module-bar />
			<div class="module-nav alt-colors">
				<div
					style="height: 64px; padding: 20px; color: red; font-family: 'Comic Sans MS', cursive;"
				>
					PROJECT CHOOSER
				</div>
				<div class="module-nav-content">
					<slot name="navigation" />
				</div>
			</div>
		</aside>
		<div class="content">
			<header>
				<button @click="navOpen = true">Toggle nav</button>
				<button v-if="drawerHasContent" @click="drawerOpen = !drawerOpen">
					Toggle drawer
				</button>
			</header>
			<main>
				<slot />
			</main>
		</div>
		<aside
			v-if="drawerHasContent"
			class="drawer alt-colors"
			:class="{ 'is-open': drawerOpen }"
			@click="drawerOpen = true"
		>
			<drawer-detail-group :drawer-open="drawerOpen">
				<slot name="drawer" />
			</drawer-detail-group>
		</aside>

		<v-overlay
			v-if="navWithOverlay"
			class="nav-overlay"
			:active="navOpen"
			@click="navOpen = false"
		/>
		<v-overlay
			v-if="drawerWithOverlay"
			class="drawer-overlay"
			:active="drawerOpen"
			@click="drawerOpen = false"
		/>
	</div>
</template>

<script lang="ts">
import { createComponent, ref, computed, watch, provide } from '@vue/composition-api';
import useWindowSize from '@/compositions/window-size';
import ModuleBar from './_module-bar.vue';
import api from '@/api';
import DrawerDetailGroup from './_drawer-detail-group.vue';

// Breakpoints:
// 600, 960, 1260, 1900

export default createComponent({
	components: {
		ModuleBar,
		DrawerDetailGroup
	},
	props: {},
	setup(props, { slots }) {
		const navOpen = ref(false);
		const drawerOpen = ref(false);

		const { width } = useWindowSize();

		const navWithOverlay = computed(() => width.value < 960);
		const drawerWithOverlay = computed(() => width.value < 1260);

		const drawerHasContent = computed(() => !!slots.drawer);

		provide('drawer-open', drawerOpen);

		return {
			navOpen,
			drawerOpen,
			navWithOverlay,
			drawerWithOverlay,
			width,
			drawerHasContent
		};
	}
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.private-view {
	--private-view-content-padding: 32px;

	display: flex;
	width: 100%;
	height: 100%;

	.nav-overlay {
		--v-overlay-z-index: 49;
	}

	.drawer-overlay {
		--v-overlay-z-index: 29;
	}

	.navigation {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 50;
		display: flex;
		height: 100%;
		font-size: 0;
		transform: translateX(-100%);
		transition: transform var(--slow) var(--transition);

		&.is-open {
			transform: translateX(0);
		}

		.module-nav {
			display: inline-block;
			width: 220px;
			height: 100%;
			font-size: 1rem;
			background-color: #eceff1;

			&-content {
				height: calc(100% - 64px);
				overflow-x: hidden;
				overflow-y: auto;
			}
		}

		@include breakpoint(medium) {
			position: relative;
			transform: none;
		}
	}

	.content {
		flex-grow: 1;

		main {
			padding: var(--private-view-content-padding);
		}
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 30;
		width: 284px;
		height: 100%;
		background-color: var(--background-color-alt);
		transform: translateX(100%);
		transition: transform var(--slow) var(--transition);

		&.is-open {
			transform: translateX(0);
		}

		@include breakpoint(medium) {
			transform: translateX(calc(100% - 64px));
		}

		@include breakpoint(large) {
			position: relative;
			flex-basis: 64px;
			transform: none;
			transition: flex-basis var(--slow) var(--transition);

			&.is-open {
				flex-basis: 284px;
				transform: none;
			}
		}
	}
}
</style>
