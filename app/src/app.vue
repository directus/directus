<template>
	<div id="app" :style="brandStyle">
		<transition name="fade">
			<div class="hydrating" v-if="hydrating">
				<v-progress-circular indeterminate />
			</div>
		</transition>

		<v-info v-if="error" type="danger" :title="$t('unexpected_error')" icon="error" center>
			{{ $t('unexpected_error_copy') }}

			<template #append>
				<v-error :error="error" />
			</template>
		</v-info>

		<router-view v-else-if="!hydrating" />

		<portal-target name="dialog-outlet" transition="transition-dialog" multiple />
		<portal-target name="menu-outlet" transition="transition-bounce" multiple />

		<mounting-portal mount-to="#custom-css" target-tag="style">{{ customCSS }}</mounting-portal>
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs, watch, computed, provide } from '@vue/composition-api';
import * as stores from '@/stores';
import api, { addTokenToURL } from '@/api';
import axios from 'axios';

import useWindowSize from '@/composables/use-window-size';
import setFavicon from '@/utils/set-favicon';

export default defineComponent({
	setup() {
		const { useAppStore, useUserStore, useServerStore } = stores;

		const appStore = useAppStore();
		const userStore = useUserStore();
		const serverStore = useServerStore();

		const { hydrating, sidebarOpen } = toRefs(appStore.state);

		const brandStyle = computed(() => {
			return {
				'--brand': serverStore.state.info?.project?.project_color || 'var(--primary)',
			};
		});

		watch(
			[() => serverStore.state.info?.project?.project_color, () => serverStore.state.info?.project?.project_logo],
			() => {
				const hasCustomLogo = !!serverStore.state.info?.project?.project_logo;
				setFavicon(serverStore.state.info?.project?.project_color || '#00C897', hasCustomLogo);
			}
		);

		const { width } = useWindowSize();

		watch(
			width,
			(newWidth, oldWidth) => {
				if (newWidth === null || newWidth === 0) return;
				if (newWidth === oldWidth) return;

				if (newWidth >= 1424) {
					if (sidebarOpen.value === false) sidebarOpen.value = true;
				} else {
					if (sidebarOpen.value === true) sidebarOpen.value = false;
				}
			},
			{ immediate: true }
		);

		watch(
			() => userStore.state.currentUser,
			(newUser) => {
				document.body.classList.remove('dark');
				document.body.classList.remove('light');
				document.body.classList.remove('auto');

				if (newUser !== undefined && newUser !== null && newUser.theme) {
					document.body.classList.add(newUser.theme);
					document
						.querySelector('head meta[name="theme-color"]')
						?.setAttribute('content', newUser.theme === 'light' ? '#ffffff' : '#263238');
				} else {
					// Default to light mode
					document.body.classList.add('light');
				}
			}
		);

		watch(
			() => serverStore.state.info?.project?.project_name,
			(projectName) => {
				document.title = projectName || 'Directus';
			}
		);

		const customCSS = computed(() => {
			return serverStore.state?.info?.project?.custom_css || '';
		});

		const error = computed(() => appStore.state.error);

		/**
		 * This allows custom extensions to use the apps internals
		 */
		provide('system', {
			...stores,
			api,
			axios,
			addTokenToURL,
		});

		return { hydrating, brandStyle, error, customCSS };
	},
});
</script>

<style lang="scss" scoped>
#app {
	height: 100%;
}

.hydrating {
	position: fixed;
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	background: rgba(255, 255, 255, 0.5);
	backdrop-filter: blur(10px);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}
</style>
