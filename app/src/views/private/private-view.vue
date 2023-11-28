<script setup lang="ts">
import VResizeable, { ResizeableOptions } from '@/components/v-resizeable.vue';
import { useLocalStorage } from '@/composables/use-local-storage';
import { useWindowSize } from '@/composables/use-window-size';
import { useUserStore } from '@/stores/user';
import { useElementSize, useSync } from '@directus/composables';
import { useAppStore } from '@directus/stores';
import { useHead } from '@unhead/vue';
import { useEventListener } from '@vueuse/core';
import { debounce } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import HeaderBar from './components/header-bar.vue';
import ModuleBar from './components/module-bar.vue';
import NotificationDialogs from './components/notification-dialogs.vue';
import NotificationsDrawer from './components/notifications-drawer.vue';
import NotificationsGroup from './components/notifications-group.vue';
import NotificationsPreview from './components/notifications-preview.vue';
import ProjectInfo from './components/project-info.vue';
import SidebarDetailGroup from './components/sidebar-detail-group.vue';

const SIZES = {
	moduleBarWidth: 60,
	minModuleNavWidth: 220,
	minContentWidth: 590,
	collapsedSidebarWidth: 60,
	overlaySpace: 60,
} as const;

const props = withDefaults(
	defineProps<{
		title?: string;
		smallHeader?: boolean;
		headerShadow?: boolean;
		splitView?: boolean;
		splitViewMinWidth?: number;
		sidebarShadow?: boolean;
	}>(),
	{
		headerShadow: true,
		splitViewMinWidth: 0,
	},
);

const emit = defineEmits(['update:splitView']);

const { t } = useI18n();

const router = useRouter();
const headTitle = computed(() => props.title ?? null);

const splitViewWritable = useSync(props, 'splitView', emit);

const contentEl = ref<HTMLElement>();
const headerBarEl = ref();
const sidebarEl = ref<Element>();

let navTransitionTimer: ReturnType<typeof setTimeout>;

const onNavTransitionEnd = () => {
	clearTimeout(navTransitionTimer);
	contentEl.value?.classList.remove('hide-overflow-x');
};

watch(splitViewWritable, () => {
	if (!contentEl.value || !headerBarEl.value) return;

	contentEl.value.classList.add('hide-overflow-x', 'hide-overflow-y');

	navTransitionTimer = setTimeout(onNavTransitionEnd, 1500);

	let headerBarTransitionTimer: ReturnType<typeof setTimeout> | undefined = undefined;
	let cleanupListener: (() => void) | undefined = undefined;

	const onHeaderBarTransitionEnd = () => {
		clearTimeout(headerBarTransitionTimer);
		cleanupListener?.();
		contentEl.value?.classList.remove('hide-overflow-y');
	};

	headerBarTransitionTimer = setTimeout(onHeaderBarTransitionEnd, 1500);
	cleanupListener = useEventListener(headerBarEl.value, 'transitionend', onHeaderBarTransitionEnd);
});

const { width: windowWidth } = useWindowSize();
const { width: sidebarWidth } = useElementSize(sidebarEl);

const showMain = computed(() => {
	if (!splitViewWritable.value) {
		return true;
	}

	let remainingWidth;

	if (windowWidth.value >= 1260) {
		remainingWidth =
			windowWidth.value - SIZES.moduleBarWidth - SIZES.minModuleNavWidth - SIZES.minContentWidth - sidebarWidth.value;
	} else if (windowWidth.value >= 960) {
		remainingWidth =
			windowWidth.value -
			SIZES.moduleBarWidth -
			SIZES.minModuleNavWidth -
			SIZES.minContentWidth -
			SIZES.collapsedSidebarWidth;
	} else {
		remainingWidth = windowWidth.value - SIZES.minContentWidth;
	}

	return remainingWidth >= props.splitViewMinWidth;
});

const { data: localStorageModuleWidth } = useLocalStorage<{
	nav?: number;
	main?: number;
}>('module-width', {});

const navWidth = ref(getWidth(localStorageModuleWidth.value?.nav, SIZES.minModuleNavWidth));

watch(
	navWidth,
	debounce((value) => {
		localStorageModuleWidth.value = {
			...(localStorageModuleWidth.value ?? {}),
			nav: value,
		};
	}, 300),
);

const mainWidth = ref(getWidth(localStorageModuleWidth.value?.main, SIZES.minContentWidth));

watch(
	mainWidth,
	debounce((value) => {
		localStorageModuleWidth.value = {
			...(localStorageModuleWidth.value ?? {}),
			main: value,
		};
	}, 300),
);

const isDraggingNav = ref(false);

const maxWidthNav = computed(() => {
	const splitViewMinWidth = splitViewWritable.value ? props.splitViewMinWidth : 0;
	const useMainWidth = showMain.value ? SIZES.minContentWidth + splitViewMinWidth : SIZES.minContentWidth;

	let maxWidth;

	if (windowWidth.value >= 1260) {
		maxWidth = windowWidth.value - SIZES.moduleBarWidth - useMainWidth - sidebarWidth.value;
	} else if (windowWidth.value >= 960) {
		maxWidth = windowWidth.value - SIZES.moduleBarWidth - useMainWidth - SIZES.collapsedSidebarWidth;
	} else {
		maxWidth = windowWidth.value - SIZES.moduleBarWidth + SIZES.overlaySpace;
	}

	return Math.max(maxWidth, SIZES.minModuleNavWidth);
});

const maxWidthMain = computed(() => {
	const splitViewMinWidth = splitViewWritable.value ? props.splitViewMinWidth : 0;

	let maxWidth;

	if (windowWidth.value >= 1260) {
		maxWidth = windowWidth.value - SIZES.moduleBarWidth - navWidth.value - splitViewMinWidth - sidebarWidth.value;
	} else if (windowWidth.value >= 960) {
		maxWidth =
			windowWidth.value - SIZES.moduleBarWidth - navWidth.value - splitViewMinWidth - SIZES.collapsedSidebarWidth;
	} else {
		// split view
		maxWidth = windowWidth.value - splitViewMinWidth;
	}

	return Math.max(maxWidth, SIZES.minContentWidth);
});

const navResizeOptions = computed<ResizeableOptions>(() => {
	return {
		snapZones: [
			{ width: 40, snapPos: SIZES.minModuleNavWidth, direction: 'left' },
			{
				width: 40,
				snapPos: maxWidthNav.value,
				direction: 'right',
			},
		],
	};
});

const isDraggingMain = ref(false);

const mainResizeOptions = computed<ResizeableOptions>(() => {
	return {
		snapZones: [
			{
				width: 40,
				snapPos: SIZES.minContentWidth,
				direction: 'left',
			},
			{
				width: 40,
				snapPos: maxWidthMain.value,
				direction: 'right',
			},
		],
		alwaysShowHandle: true,
		disableTransition: isDraggingNav.value,
	};
});

const navOpen = ref(false);
const userStore = useUserStore();
const appStore = useAppStore();

const appAccess = computed(() => {
	if (!userStore.currentUser) return true;
	return userStore.currentUser?.role?.app_access || false;
});

const notificationsPreviewActive = ref(false);

const { sidebarOpen, fullScreen } = storeToRefs(appStore);

const appearance = computed(() => {
	return userStore.currentUser && 'appearance' in userStore.currentUser ? userStore.currentUser.appearance : 'auto';
});

provide('main-element', contentEl);

router.afterEach(() => {
	contentEl.value?.scrollTo({ top: 0 });
	fullScreen.value = false;
});

useHead({
	title: headTitle,
});

function openSidebar(event: MouseEvent) {
	if (event.target && (event.target as HTMLElement).classList.contains('close') === false) {
		sidebarOpen.value = true;
	}
}

function getWidth(input: unknown, fallback: number): number {
	return input && !Number.isNaN(input) ? Number(input) : fallback;
}
</script>

<template>
	<v-info v-if="appAccess === false" center :title="t('no_app_access')" type="danger" icon="block">
		{{ t('no_app_access_copy') }}

		<template #append>
			<v-button to="/logout">{{ t('switch_user') }}</v-button>
		</template>
	</v-info>

	<div v-else class="private-view" :class="{ appearance, 'full-screen': fullScreen, splitView }">
		<aside
			id="navigation"
			role="navigation"
			aria-label="Module Navigation"
			:class="{ 'is-open': navOpen, 'has-shadow': sidebarShadow }"
		>
			<module-bar />
			<v-resizeable
				v-model:width="navWidth"
				:min-width="SIZES.minModuleNavWidth"
				:max-width="maxWidthNav"
				:options="navResizeOptions"
				@dragging="(value) => (isDraggingNav = value)"
				@transition-end="onNavTransitionEnd"
			>
				<div class="module-nav alt-colors">
					<project-info />

					<div class="module-nav-content">
						<slot name="navigation" />
					</div>
				</div>
			</v-resizeable>
		</aside>
		<div id="main-content" ref="contentEl" class="content">
			<header-bar
				ref="headerBarEl"
				:small="smallHeader || splitView"
				:shadow="headerShadow || splitView"
				show-sidebar-toggle
				:title="title"
				@toggle:sidebar="sidebarOpen = !sidebarOpen"
				@primary="navOpen = !navOpen"
			>
				<template v-for="(_, scopedSlotName) in $slots" #[scopedSlotName]="slotData">
					<slot :name="scopedSlotName" v-bind="slotData" />
				</template>
			</header-bar>

			<div class="content-wrapper">
				<v-resizeable
					v-model:width="mainWidth"
					:min-width="SIZES.minContentWidth"
					:max-width="maxWidthMain"
					:disabled="!splitViewWritable"
					:options="mainResizeOptions"
					@dragging="(value) => (isDraggingMain = value)"
				>
					<main v-show="showMain">
						<slot />
					</main>
				</v-resizeable>

				<div v-if="splitView" id="split-content" :class="{ 'is-dragging': isDraggingMain }">
					<slot name="splitView" />
				</div>
			</div>
		</div>
		<aside
			id="sidebar"
			ref="sidebarEl"
			role="contentinfo"
			class="alt-colors"
			aria-label="Module Sidebar"
			:class="{ 'is-open': sidebarOpen, 'has-shadow': sidebarShadow }"
			@click="openSidebar"
		>
			<div class="flex-container">
				<sidebar-detail-group :sidebar-open="sidebarOpen">
					<slot name="sidebar" />
				</sidebar-detail-group>

				<div class="spacer" />

				<notifications-preview v-model="notificationsPreviewActive" :sidebar-open="sidebarOpen" />
			</div>
		</aside>

		<v-overlay class="nav-overlay" :active="navOpen" @click="navOpen = false" />
		<v-overlay class="sidebar-overlay" :active="sidebarOpen" @click="sidebarOpen = false" />

		<notifications-drawer />
		<notifications-group v-if="notificationsPreviewActive === false" :sidebar-open="sidebarOpen" />
		<notification-dialogs />
	</div>
</template>

<style lang="scss" scoped>
.private-view {
	--content-padding: 12px;
	--content-padding-bottom: 60px;
	--layout-offset-top: calc(var(--header-bar-height) - 1px);

	display: flex;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background-color: var(--theme--background);

	.nav-overlay {
		--v-overlay-z-index: 49;

		@media (min-width: 960px) {
			display: none;
		}
	}

	.sidebar-overlay {
		--v-overlay-z-index: 29;

		@media (min-width: 1260px) {
			display: none;
		}
	}

	#navigation {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 50;
		display: flex;
		height: 100%;
		font-size: 0;
		transform: translateX(-100%);
		transition: transform var(--slow) var(--transition);
		font-family: var(--theme--navigation--list--font-family);
		border-right: var(--theme--navigation--border-width) solid var(--theme--navigation--border-color);

		&.is-open {
			transform: translateX(0);
		}

		&.has-shadow {
			box-shadow: var(--navigation-shadow);
		}

		.module-nav {
			position: relative;
			display: inline-block;
			width: 220px;
			height: 100%;
			font-size: 1rem;
			background: var(--theme--navigation--background);

			&-content {
				--v-list-item-color: var(--theme--navigation--list--foreground);
				--v-list-item-color-hover: var(--theme--navigation--list--foreground-hover);
				--v-list-item-color-active: var(--theme--navigation--list--foreground-active);
				--v-list-item-icon-color: var(--theme--navigation--list--icon--foreground);
				--v-list-item-icon-color-hover: var(--theme--navigation--list--icon--foreground-hover);
				--v-list-item-icon-color-active: var(--theme--navigation--list--icon--foreground-active);
				--v-list-item-background-color: var(--theme--navigation--list--background);
				--v-list-item-background-color-hover: var(--theme--navigation--list--background-hover);
				--v-list-item-background-color-active: var(--theme--navigation--list--background-active);

				--v-divider-color: var(--theme--navigation--list--divider--border-color);
				--v-divider-thickness: var(--theme--navigation--list--divider--border-width);

				height: calc(100% - 64px);
				overflow-x: hidden;
				overflow-y: auto;
			}
		}

		@media (min-width: 960px) {
			position: relative;
			transform: none;
		}
	}

	#main-content {
		position: relative;
		flex-grow: 1;
		width: 100%;
		height: 100%;
		overflow: auto;
		scroll-padding-top: 100px;

		/* Page Content Spacing (Could be converted to Project Setting toggle) */
		font-size: 15px;
		line-height: 24px;

		.content-wrapper,
		main {
			display: contents;
		}

		/* Offset for partially visible sidebar */
		@media (min-width: 960px) {
			margin-right: 60px;
		}

		@media (min-width: 1260px) {
			margin-right: 0;
		}

		&.hide-overflow-x {
			overflow-x: hidden;
		}

		&.hide-overflow-y {
			overflow-y: hidden;
		}
	}

	&.splitView {
		#main-content .content-wrapper {
			display: flex;
			height: calc(100% - var(--layout-offset-top));

			main {
				display: block;
				flex-grow: 0;
				overflow: auto;
				max-height: 100%;
			}

			#split-content {
				flex-grow: 1;
				overflow: auto;
				height: 100%;

				&.is-dragging {
					pointer-events: none;
				}
			}
		}
	}

	#sidebar {
		--theme--form--column-gap: var(--theme--sidebar--section--form--column-gap);
		--theme--form--row-gap: var(--theme--sidebar--section--form--row-gap);

		--theme--form--field--input--background-subdued: var(--theme--sidebar--section--form--field--input--background);
		--theme--form--field--input--background: var(--theme--sidebar--section--form--field--input--background);
		--theme--form--field--input--border-color-focus: var(
			--theme--sidebar--section--form--field--input--border-color-focus
		);
		--theme--form--field--input--border-color-hover: var(
			--theme--sidebar--section--form--field--input--border-color-hover
		);
		--theme--form--field--input--border-color: var(--theme--sidebar--section--form--field--input--border-color);
		--theme--form--field--input--box-shadow-focus: var(--theme--sidebar--section--form--field--input--box-shadow-focus);
		--theme--form--field--input--box-shadow-hover: var(--theme--sidebar--section--form--field--input--box-shadow-hover);
		--theme--form--field--input--box-shadow: var(--theme--sidebar--section--form--field--input--box-shadow);
		--theme--form--field--input--foreground-subdued: var(
			--theme--sidebar--section--form--field--input--foreground-subdued
		);
		--theme--form--field--input--foreground: var(--theme--sidebar--section--form--field--input--foreground);
		--theme--form--field--input--height: var(--theme--sidebar--section--form--field--input--height);
		--theme--form--field--input--padding: var(--theme--sidebar--section--form--field--input--padding);

		--theme--form--field--label--foreground: var(--theme--sidebar--section--form--field--label--foreground);
		--theme--form--field--label--font-family: var(--theme--sidebar--section--form--field--label--font-family);

		position: fixed;
		top: 0;
		right: 0;
		z-index: 30;
		width: 280px;
		height: 100%;
		overflow: hidden;
		background-color: var(--theme--sidebar--background);
		transform: translateX(100%);
		transition: transform var(--slow) var(--transition);
		font-family: var(--theme--sidebar--font-family);
		border-left: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);

		/* Explicitly render the border outside of the width of the bar itself */
		box-sizing: content-box;

		.spacer {
			flex-grow: 1;
		}

		&.is-open {
			transform: translateX(0);
		}
		&.has-shadow {
			box-shadow: var(--sidebar-shadow);
		}

		.flex-container {
			display: flex;
			flex-direction: column;
			width: 280px;
			height: 100%;
		}

		@media (min-width: 960px) {
			transform: translateX(calc(100% - 60px - var(--theme--sidebar--border-width)));
		}

		@media (min-width: 1260px) {
			position: relative;
			flex-basis: 60px;
			flex-shrink: 0;
			transition:
				flex-basis var(--slow) var(--transition),
				transform var(--slow) var(--transition);

			&.is-open {
				flex-basis: 280px;
			}
		}
	}

	@media (min-width: 600px) {
		--content-padding: 32px;
		--content-padding-bottom: 132px;
	}

	&.full-screen {
		#navigation {
			position: fixed;
			transform: translateX(-100%);
			transition: none;
		}

		#main-content {
			margin: 0;
		}

		#sidebar {
			position: fixed;
			transform: translateX(100%);
			transition: none;
		}
	}
}
</style>
