<template>
	<div class="private-view">
		<aside role="navigation" class="navigation" :class="{ 'is-open': navOpen }">
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
			<header-bar
				:title="title"
				:dense="_headerDense"
				@toggle:drawer="drawerOpen = !drawerOpen"
				@toggle:nav="navOpen = !navOpen"
			>
				<template
					v-for="(_, scopedSlotName) in $scopedSlots"
					v-slot:[scopedSlotName]="slotData"
				>
					<slot :name="scopedSlotName" v-bind="slotData" />
				</template>
			</header-bar>
			<main ref="mainContent" @scroll="onMainScroll" :class="{ 'header-dense': headerDense }">
				<slot />
			</main>
		</div>
		<aside
			role="contentinfo"
			class="drawer alt-colors"
			:class="{ 'is-open': drawerOpen }"
			@click="drawerOpen = true"
		>
			<drawer-detail-group :drawer-open="drawerOpen">
				<slot name="drawer" />
			</drawer-detail-group>
		</aside>

		<v-overlay class="nav-overlay" :active="navOpen" @click="navOpen = false" />
		<v-overlay class="drawer-overlay" :active="drawerOpen" @click="drawerOpen = false" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, provide, computed } from '@vue/composition-api';
import ModuleBar from './module-bar/';
import DrawerDetailGroup from './drawer-detail-group/';
import HeaderBar from './header-bar';
import { throttle } from 'lodash';

export default defineComponent({
	components: {
		ModuleBar,
		DrawerDetailGroup,
		HeaderBar
	},
	props: {
		title: {
			type: String,
			required: true
		},
		headerDense: {
			type: Boolean,
			default: false
		},
		headerDenseAuto: {
			type: Boolean,
			default: true
		}
	},
	setup(props) {
		const mainElement = ref<Element>(null);

		const navOpen = ref(false);
		const drawerOpen = ref(false);

		provide('drawer-open', drawerOpen);

		const headerDenseAutoState = ref(false);

		const _headerDense = computed<boolean>(() => {
			if (props.headerDenseAuto === true) {
				return headerDenseAutoState.value;
			} else {
				return props.headerDense;
			}
		});

		const onMainScroll = throttle(event => {
			const { scrollTop } = event.target;

			if (scrollTop <= 5 && headerDenseAutoState.value === true) {
				headerDenseAutoState.value = false;
			} else if (scrollTop > 5 && headerDenseAutoState.value === false) {
				headerDenseAutoState.value = true;
			}
		}, 50);

		return {
			navOpen,
			drawerOpen,
			_headerDense,
			mainElement,
			onMainScroll
		};
	}
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.private-view {
	--private-view-content-padding: 12px;

	display: flex;
	width: 100%;
	height: 100%;

	.nav-overlay {
		--v-overlay-z-index: 49;

		@include breakpoint(medium) {
			display: none;
		}
	}

	.drawer-overlay {
		--v-overlay-z-index: 29;

		@include breakpoint(large) {
			display: none;
		}
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
		position: relative;
		flex-grow: 1;
		height: 100%;
		overflow: hidden;

		.header-bar {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
		}

		main {
			height: 100%;
			padding: var(--private-view-content-padding);
			padding-top: 114px;
			overflow: auto;
		}

		// Offset for partially visible drawer
		@include breakpoint(medium) {
			padding-right: 64px;
		}

		@include breakpoint(large) {
			padding-right: 0;
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
			flex-shrink: 0;
			transform: none;
			transition: flex-basis var(--slow) var(--transition);

			&.is-open {
				flex-basis: 284px;
				transform: none;
			}
		}
	}

	@include breakpoint(small) {
		--private-view-content-padding: 32px;
	}
}
</style>
