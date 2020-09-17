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

		<router-view v-else-if="!hydrating && appAccess" />

		<v-info v-else-if="appAccess === false" center :title="$t('no_app_access')" type="danger" icon="block">
			{{ $t('no_app_access_copy') }}

			<template #append>
				<v-button to="/logout">Switch User</v-button>
			</template>
		</v-info>

		<portal-target name="dialog-outlet" transition="transition-dialog" multiple />
		<portal-target name="menu-outlet" transition="transition-bounce" multiple />
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs, watch, computed, provide } from '@vue/composition-api';
import * as stores from '@/stores';
import api from '@/api';
import axios from 'axios';

import useWindowSize from '@/composables/use-window-size';
import setFavicon from '@/utils/set-favicon';

export default defineComponent({
	setup() {
		const { useAppStore, useUserStore, useSettingsStore } = stores;

		const appStore = useAppStore();
		const userStore = useUserStore();
		const settingsStore = useSettingsStore();

		const { hydrating, drawerOpen } = toRefs(appStore.state);

		const brandStyle = computed(() => {
			return {
				'--brand': settingsStore.state.settings?.project_color || 'var(--primary)',
			};
		});

		watch(
			[() => settingsStore.state.settings?.project_color, () => settingsStore.state.settings?.project_logo],
			() => {
				const hasCustomLogo = !!settingsStore.state.settings?.project_logo;
				setFavicon(settingsStore.state.settings?.project_color || '#2f80ed', hasCustomLogo);
			}
		);

		const { width } = useWindowSize();

		watch(
			width,
			(newWidth, oldWidth) => {
				if (newWidth === null || newWidth === 0) return;
				if (newWidth === oldWidth) return;

				if (newWidth >= 1424) {
					if (drawerOpen.value === false) drawerOpen.value = true;
				} else {
					if (drawerOpen.value === true) drawerOpen.value = false;
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

				if (newUser !== undefined && newUser !== null) {
					document.body.classList.add(newUser.theme);
				} else {
					// Default to light mode
					document.body.classList.add('light');
				}
			}
		);

		const appAccess = computed(() => {
			if (!userStore.state.currentUser) return true;
			return userStore.state.currentUser?.role?.app_access || false;
		});

		const error = computed(() => appStore.state.error);

		/**
		 * This allows custom extensions to use the apps internals
		 */
		provide('system', {
			...stores,
			api,
			axios,
		});

		return { hydrating, brandStyle, appAccess, error };
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
