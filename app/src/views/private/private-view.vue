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
			<v-nav
				class="module-nav alt-colors"
				resizeable
				:min-width="moduleNavMinWidth"
				:max-width="moduleNavMaxWidth"
				:width="moduleNavWidth"
				@update:width="updateModuleNavWidth"
			>
				<project-info />

				<div class="module-nav-content">
					<slot name="navigation" />
				</div>
			</v-nav>
		</aside>
		<div id="main-content" ref="contentEl" class="content">
			<header-bar
				:small="smallHeader"
				:shadow="headerShadow"
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

<script setup lang="ts">
import { useElementSize } from '@directus/composables';
import { useLocalStorage } from '@/composables/use-local-storage';
import { useTitle } from '@/composables/use-title';
import { useWindowSize } from '@/composables/use-window-size';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
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

interface Props {
	title?: string | null;
	smallHeader?: boolean;
	headerShadow?: boolean;
}

const props = withDefaults(defineProps<Props>(), { title: null, smallHeader: false, headerShadow: true });

const { t } = useI18n();

const router = useRouter();

const contentEl = ref<Element>();
const sidebarEl = ref<Element>();
const { width: windowWidth } = useWindowSize();
const { width: contentWidth } = useElementSize(contentEl);
const { width: sidebarWidth } = useElementSize(sidebarEl);

const { data: localStorageModuleNavWidth } = useLocalStorage('module-nav-width');
const moduleNavMinWidth = 220;
const moduleNavMaxWidth = ref();
const moduleNavWidth = ref(localStorageModuleNavWidth.value);
const moduleNavCurrentWidth = ref();

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

router.afterEach(() => {
	contentEl.value?.scrollTo({ top: 0 });
	fullScreen.value = false;
});

useTitle(title);

function updateModuleNavWidth(width: number) {
	moduleNavCurrentWidth.value = width;

	if (width === moduleNavMinWidth) {
		localStorageModuleNavWidth.value = null;
	} else {
		localStorageModuleNavWidth.value = width;
	}
}

watch(
	[windowWidth, contentWidth, sidebarWidth],
	() => {
		if (windowWidth.value > 1260) {
			// 590 = minimum content width, 60 = module bar width, and dynamic side bar width
			moduleNavMaxWidth.value = windowWidth.value - (590 + 60 + sidebarWidth.value);
		} else if (windowWidth.value > 960) {
			// 590 = minimum content width, 60 = module bar width, 60 = side bar width
			moduleNavMaxWidth.value = windowWidth.value - (590 + 60 + 60);
		} else {
			// first 60 = module bar width, second 60 = room for overlay
			moduleNavMaxWidth.value = windowWidth.value - (60 + 60);
		}

		if (moduleNavCurrentWidth.value && moduleNavCurrentWidth.value > moduleNavMaxWidth.value) {
			moduleNavWidth.value = Math.max(220, moduleNavMaxWidth.value);
		}
	},
	{ immediate: true }
);

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
	--layout-offset-top: calc(var(--header-bar-height) - 1px);

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
