<template>
	<v-info v-if="appAccess === false" center :title="t('no_app_access')" type="danger" icon="block">
		{{ t('no_app_access_copy') }}

		<template #append>
			<v-button to="/logout">Switch User</v-button>
		</template>
	</v-info>

	<div v-else class="private-view" :class="{ theme, 'full-screen': fullScreen }">
		<aside id="navigation" role="navigation" aria-label="Module Navigation" :class="{ 'is-open': navOpen }">
			<module-bar />
			<div class="module-nav alt-colors">
				<project-info />

				<div class="module-nav-content">
					<slot name="navigation" />
				</div>
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
		<notifications-group v-if="notificationsPreviewActive === false" :dense="sidebarOpen === false" />
		<notification-dialogs />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, provide, toRefs, computed } from 'vue';
import ModuleBar from './components/module-bar.vue';
import SidebarDetailGroup from './components/sidebar-detail-group/';
import HeaderBar from './components/header-bar';
import ProjectInfo from './components/project-info';
import NotificationsGroup from './components/notifications-group/';
import NotificationsPreview from './components/notifications-preview/';
import NotificationDialogs from './components/notification-dialogs/';
import NotificationsDrawer from './components/notifications-drawer.vue';
import { useUserStore, useAppStore } from '@/stores';
import { useRouter } from 'vue-router';
import useTitle from '@/composables/use-title';
import { storeToRefs } from 'pinia';

export default defineComponent({
	components: {
		ModuleBar,
		SidebarDetailGroup,
		HeaderBar,
		ProjectInfo,
		NotificationsGroup,
		NotificationsPreview,
		NotificationDialogs,
		NotificationsDrawer,
	},
	props: {
		title: {
			type: String,
			default: null,
		},
		smallHeader: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		const { title } = toRefs(props);
		const navOpen = ref(false);
		const contentEl = ref<Element>();
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

		router.afterEach(async () => {
			contentEl.value?.scrollTo({ top: 0 });
			fullScreen.value = false;
		});

		useTitle(title);

		return {
			t,
			navOpen,
			contentEl,
			theme,
			sidebarOpen,
			openSidebar,
			notificationsPreviewActive,
			appAccess,
			fullScreen,
		};

		function openSidebar(event: PointerEvent) {
			if (event.target && (event.target as HTMLElement).classList.contains('close') === false) {
				sidebarOpen.value = true;
			}
		}
	},
});
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

		.module-nav {
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
		--input-padding: 16px; // (60 - 4 - 24) / 2

		position: relative;
		flex-grow: 1;
		width: 100%;
		height: 100%;
		overflow: auto;
		scroll-padding-top: 100px;

		// Page Content Spacing (Could be converted to Project Setting toggle)
		font-size: 15px;
		line-height: 24px;

		main {
			display: contents;
		}

		// Offset for partially visible sidebar
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
