<template>
	<div class="private-view">
		<aside
			role="navigation"
			aria-label="Module Navigation"
			class="navigation"
			:class="{ 'is-open': navOpen }"
		>
			<module-bar />
			<div class="module-nav alt-colors">
				<project-chooser />

				<div class="module-nav-content">
					<slot name="navigation" />
				</div>
			</div>
		</aside>
		<div class="content" ref="contentEl">
			<header-bar
				:title="title"
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

			<main>
				<slot />
			</main>
		</div>
		<aside
			role="contentinfo"
			class="drawer alt-colors"
			aria-label="Module Drawer"
			:class="{ 'is-open': drawerOpen }"
			@click="drawerOpen = true"
		>
			<drawer-button
				class="drawer-toggle"
				@click.stop="drawerOpen = !drawerOpen"
				:icon="drawerOpen ? 'chevron_right' : 'chevron_left'"
			>
				{{ $t('collapse_sidebar') }}
			</drawer-button>

			<drawer-detail-group :drawer-open="drawerOpen">
				<slot name="drawer" />
			</drawer-detail-group>

			<div class="spacer" />

			<notifications-preview v-model="navigationsInline" />
		</aside>

		<v-overlay class="nav-overlay" :active="navOpen" @click="navOpen = false" />
		<v-overlay class="drawer-overlay" :active="drawerOpen" @click="drawerOpen = false" />

		<notifications-group v-if="navigationsInline === false" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, provide, watch } from '@vue/composition-api';
import ModuleBar from './components/module-bar/';
import DrawerDetailGroup from './components/drawer-detail-group/';
import HeaderBar from './components/header-bar';
import ProjectChooser from './components/project-chooser';
import DrawerButton from './components/drawer-button/';
import NotificationsGroup from './components/notifications-group/';
import NotificationsPreview from './components/notifications-preview/';

export default defineComponent({
	components: {
		ModuleBar,
		DrawerDetailGroup,
		HeaderBar,
		ProjectChooser,
		DrawerButton,
		NotificationsGroup,
		NotificationsPreview,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
	},
	setup() {
		const navOpen = ref(false);
		const drawerOpen = ref(false);
		const contentEl = ref<Element>();
		const navigationsInline = ref(false);

		watch(drawerOpen, (open: boolean) => {
			if (open === false) {
				navigationsInline.value = false;
			}
		});

		provide('drawer-open', drawerOpen);
		provide('main-element', contentEl);

		return {
			navOpen,
			drawerOpen,
			contentEl,
			navigationsInline,
		};
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.private-view {
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
		width: 100%;
		height: 100%;
		overflow: auto;

		main {
			display: contents;
		}

		// Offset for partially visible drawer
		@include breakpoint(medium) {
			margin-right: 64px;
		}

		@include breakpoint(large) {
			margin-right: 0;
		}
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 30;
		display: flex;
		flex-direction: column;
		width: 284px;
		height: 100%;
		background-color: var(--background-normal);
		transform: translateX(100%);
		transition: transform var(--slow) var(--transition);

		.spacer {
			flex-grow: 1;
		}

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
		--content-padding: 32px;
	}
}
</style>
