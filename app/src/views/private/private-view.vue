<template>
	<v-info v-if="appAccess === false" center :title="t('no_app_access')" type="danger" icon="block">
		{{ t('no_app_access_copy') }}

		<template #append>
			<v-button to="/logout">{{ t('switch_user') }}</v-button>
		</template>
	</v-info>

	<div v-else class="private-view" :class="{ theme, 'full-screen': fullScreen }">
		<aside id="navigation" role="navigation" aria-label="Module Navigation" :class="{ 'is-open': navOpen }">
			<module-bar />
			<div ref="moduleNavEl" class="module-nav alt-colors">
				<project-info />

				<div class="module-nav-content">
					<slot name="navigation" />
				</div>

				<div
					class="module-nav-resize-handle"
					:class="{ active: handleHover }"
					@pointerenter="handleHover = true"
					@pointerleave="handleHover = false"
					@pointerdown.self="onResizeHandlePointerDown"
					@dblclick="resetModuleNavWidth"
				/>
			</div>
		</aside>
		<div id="main-content" ref="contentEl" class="content">
			<header-bar
				:small="smallHeader"
				show-sidebar-toggle
				:title="title"
				@toggle:sidebar="sidebarOpen = !sidebarOpen"
				@primary="navOpen = !navOpen"
			>
				<template v-for="(_, scopedSlotName) in $slots" #[scopedSlotName]="slotData">
					<slot :name="scopedSlotName" v-bind="slotData" />
				</template>
			</header-bar>

			<main>
				<slot />
			</main>
		</div>
		<aside
			id="sidebar"
			ref="sidebarEl"
			role="contentinfo"
			class="alt-colors"
			aria-label="Module Sidebar"
			:class="{ 'is-open': sidebarOpen }"
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

<script lang="ts" setup>
import { useElementSize } from '@directus/shared/composables';
import { useEventListener } from '@/composables/use-event-listener';
import { useLocalStorage } from '@/composables/use-local-storage';
import { useTitle } from '@/composables/use-title';
import { useWindowSize } from '@/composables/use-window-size';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { debounce } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, onMounted, provide, ref, toRefs, watch } from 'vue';
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

interface Props {
	title?: string | null;
	smallHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), { title: null, smallHeader: false });

const { t } = useI18n();

const router = useRouter();

const contentEl = ref<Element>();
const sidebarEl = ref<Element>();
const { width: windowWidth } = useWindowSize();
const { width: contentWidth } = useElementSize(contentEl);
const { width: sidebarWidth } = useElementSize(sidebarEl);

const moduleNavEl = ref<HTMLElement>();
const { handleHover, onResizeHandlePointerDown, resetModuleNavWidth, onPointerMove, onPointerUp } =
	useModuleNavResize();
useEventListener(window, 'pointermove', onPointerMove);
useEventListener(window, 'pointerup', onPointerUp);

const { data } = useLocalStorage('module-nav-width');

onMounted(() => {
	if (!data.value) return;
	if (Number.isNaN(data.value)) return;
	moduleNavEl.value!.style.width = `${data.value}px`;
});

const { title } = toRefs(props);
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
	return userStore.currentUser?.theme || 'auto';
});

provide('main-element', contentEl);

router.afterEach(async (to, from) => {
	// Hash changes in docs, #12752
	if (to.path === from.path) return;

	contentEl.value?.scrollTo({ top: 0 });
	fullScreen.value = false;
});

useTitle(title);

function useModuleNavResize() {
	const handleHover = ref<boolean>(false);
	const dragging = ref<boolean>(false);
	const dragStartX = ref<number>(0);
	const dragStartWidth = ref<number>(0);
	const currentWidth = ref<number | null>(null);
	const currentWidthLimit = ref<number>(0);
	const rafId = ref<number | null>(null);

	watch(
		currentWidth,
		debounce((newVal) => {
			if (newVal === 220) {
				data.value = null;
			} else {
				data.value = newVal;
			}
		}, 300)
	);

	watch(
		[windowWidth, contentWidth, sidebarWidth],
		() => {
			if (windowWidth.value > 1260) {
				// 590 = minimum content width, 60 = module bar width, and dynamic side bar width
				currentWidthLimit.value = windowWidth.value - (590 + 60 + sidebarWidth.value);
			} else if (windowWidth.value > 960) {
				// 590 = minimum content width, 60 = module bar width, 60 = side bar width
				currentWidthLimit.value = windowWidth.value - (590 + 60 + 60);
			} else {
				// first 60 = module bar width, second 60 = room for overlay
				currentWidthLimit.value = windowWidth.value - (60 + 60);
			}

			if (currentWidth.value && currentWidth.value > currentWidthLimit.value) {
				currentWidth.value = Math.max(220, currentWidthLimit.value);
				moduleNavEl.value!.style.width = `${currentWidth.value}px`;
			}
		},
		{ immediate: true }
	);

	return { handleHover, onResizeHandlePointerDown, resetModuleNavWidth, onPointerMove, onPointerUp };

	function onResizeHandlePointerDown(event: PointerEvent) {
		dragging.value = true;
		dragStartX.value = event.pageX;
		dragStartWidth.value = moduleNavEl.value!.offsetWidth;
	}

	function resetModuleNavWidth() {
		currentWidth.value = 220;
		moduleNavEl.value!.style.width = `220px`;
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging.value) return;

		rafId.value = window.requestAnimationFrame(() => {
			currentWidth.value = Math.max(220, dragStartWidth.value + (event.pageX - dragStartX.value));
			if (currentWidth.value >= currentWidthLimit.value) currentWidth.value = currentWidthLimit.value;
			if (currentWidth.value > 220 && currentWidth.value <= 230) currentWidth.value = 220; // snap when nearing min width
			moduleNavEl.value!.style.width = `${currentWidth.value}px`;
		});
	}

	function onPointerUp() {
		if (dragging.value === true) {
			dragging.value = false;
			if (rafId.value) {
				window.cancelAnimationFrame(rafId.value);
			}
		}
	}
}

function openSidebar(event: PointerEvent) {
	if (event.target && (event.target as HTMLElement).classList.contains('close') === false) {
		sidebarOpen.value = true;
	}
}
</script>

<style lang="scss" scoped>
.private-view {
	--content-padding: 12px;
	--content-padding-bottom: 60px;

	display: flex;
	width: 100%;
	height: 100%;
	overflow-x: hidden;
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

		&:not(.is-open) {
			.module-nav-resize-handle {
				display: none;
			}
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

		.module-nav-resize-handle {
			position: absolute;
			top: 0;
			right: -2px;
			bottom: 0;
			width: 4px;
			z-index: 3;
			background-color: var(--primary);
			cursor: ew-resize;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
			transition-delay: 0;
			user-select: none;
			touch-action: none;

			&:hover,
			&:active {
				opacity: 1;
			}

			&.active {
				transition-delay: var(--slow);
			}
		}

		@media (min-width: 960px) {
			position: relative;
			transform: none;

			&:not(.is-open) {
				.module-nav-resize-handle {
					display: block;
				}
			}
		}
	}

	#main-content {
		--border-radius: 6px;
		--input-height: 60px;
		--input-padding: 16px; /* (60 - 4 - 24) / 2 */

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
