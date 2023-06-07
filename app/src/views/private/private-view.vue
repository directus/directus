<template>
	<v-info v-if="appAccess === false" center :title="t('no_app_access')" type="danger" icon="block">
		{{ t('no_app_access_copy') }}

		<template #append>
			<v-button to="/logout">{{ t('switch_user') }}</v-button>
		</template>
	</v-info>

	<div v-else class="private-view" :class="{ theme, 'full-screen': fullScreen, splitView }">
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
				@transition-end="resetContentOverflowX"
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

<script setup lang="ts">
import VResizeable, { ResizeableOptions } from '@/components/v-resizeable.vue';
import { useLocalStorage } from '@/composables/use-local-storage';
import { useTitle } from '@/composables/use-title';
import { useWindowSize } from '@/composables/use-window-size';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { useElementSize, useSync } from '@directus/composables';
import { useEventListener } from '@vueuse/core';
import { debounce } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, provide, ref, toRefs, watch } from 'vue';
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
		title?: string | null;
		smallHeader?: boolean;
		headerShadow?: boolean;
		splitView?: boolean;
		splitViewMinWidth?: number;
		sidebarShadow?: boolean;
	}>(),
	{
		title: null,
		headerShadow: true,
		splitViewMinWidth: 0,
	}
);

const emit = defineEmits(['update:splitView']);

const { t } = useI18n();

const router = useRouter();
const { title } = toRefs(props);

const splitViewWritable = useSync(props, 'splitView', emit);

const contentEl = ref<HTMLElement>();
const headerBarEl = ref();
const sidebarEl = ref<Element>();

let navTransitionTimer: ReturnType<typeof setTimeout>;
let previousContentOverflowX: string | null = null;

const resetContentOverflowX = () => {
	if (previousContentOverflowX !== null && contentEl.value) {
		contentEl.value.style.overflowY = previousContentOverflowX;
		previousContentOverflowX = null;
	}

	clearTimeout(navTransitionTimer);
};

watch(splitViewWritable, () => {
	if (!headerBarEl.value || !contentEl.value) return;

	previousContentOverflowX = contentEl.value.style.overflowX;
	contentEl.value.style.overflowX = 'hidden';
	navTransitionTimer = setTimeout(resetContentOverflowX, 1500);

	const previousContentOverflowY = contentEl.value.style.overflowY;
	contentEl.value.style.overflowY = 'hidden';

	let headerBarTransitionTimer: ReturnType<typeof setTimeout>;
	let cleanupListener: () => void;

	const resetContentOverflowY = () => {
		if (contentEl.value) {
			contentEl.value.style.overflowY = previousContentOverflowY;
		}

		clearTimeout(headerBarTransitionTimer);
		cleanupListener();
	};

	headerBarTransitionTimer = setTimeout(resetContentOverflowY, 1500);
	cleanupListener = useEventListener(headerBarEl.value, 'transitionend', resetContentOverflowY);
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
	}, 300)
);

const mainWidth = ref(getWidth(localStorageModuleWidth.value?.main, SIZES.minContentWidth));

watch(
	mainWidth,
	debounce((value) => {
		localStorageModuleWidth.value = {
			...(localStorageModuleWidth.value ?? {}),
			main: value,
		};
	}, 300)
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

const theme = computed(() => {
	return userStore.currentUser && 'theme' in userStore.currentUser ? userStore.currentUser.theme : 'auto';
});

provide('main-element', contentEl);

router.afterEach(() => {
	contentEl.value?.scrollTo({ top: 0 });
	fullScreen.value = false;
});

useTitle(title);

function openSidebar(event: MouseEvent) {
	if (event.target && (event.target as HTMLElement).classList.contains('close') === false) {
		sidebarOpen.value = true;
	}
}

function getWidth(input: unknown, fallback: number): number {
	return input && !Number.isNaN(input) ? Number(input) : fallback;
}
</script>

<style lang="scss" scoped>
.private-view {
	--content-padding: 12px;
	--content-padding-bottom: 60px;
	--layout-offset-top: calc(var(--header-bar-height) - 1px);

	display: flex;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background-color: var(--background-page);

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
			background-color: var(--background-normal);

			&-content {
				--v-list-item-background-color-hover: var(--background-normal-alt);
				--v-list-item-background-color-active: var(--background-normal-alt);

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
		--border-radius: 6px;
		--input-height: 60px;
		--input-padding: 16px;
		/* (60 - 4 - 24) / 2 */

		position: relative;
		flex-grow: 1;
		width: 100%;
		height: 100%;
		overflow: auto;
		scroll-padding-top: 100px;

		/* Page Content Spacing (Could be converted to Project Setting toggle) */
		font-size: 15px;
		line-height: 24px;

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
		position: fixed;
		top: 0;
		right: 0;
		z-index: 30;
		width: 280px;
		height: 100%;
		overflow: hidden;
		background-color: var(--background-normal);
		transform: translateX(100%);
		transition: transform var(--slow) var(--transition);

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
			transform: translateX(calc(100% - 60px));
		}

		@media (min-width: 1260px) {
			position: relative;
			flex-basis: 60px;
			flex-shrink: 0;
			transition: flex-basis var(--slow) var(--transition), transform var(--slow) var(--transition);

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
