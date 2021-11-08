<template>
	<div id="directus" :style="brandStyle">
		<transition name="fade">
			<div v-if="hydrating" class="hydrating">
				<v-progress-circular indeterminate />
			</div>
		</transition>

		<v-info v-if="error" type="danger" :title="t('unexpected_error')" icon="error" center>
			{{ t('unexpected_error_copy') }}

			<template #append>
				<v-error :error="error" />
			</template>
		</v-info>

		<router-view v-else-if="!hydrating" />

		<teleport to="#custom-css">{{ customCSS }}</teleport>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs, watch, computed, onMounted, onUnmounted } from 'vue';
import { useAppStore, useUserStore, useServerStore } from '@/stores';
import { startIdleTracking, stopIdleTracking } from './idle';
import useSystem from '@/composables/use-system';

import setFavicon from '@/utils/set-favicon';
import { setLanguage } from '@/lang/set-language';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const appStore = useAppStore();
		const userStore = useUserStore();
		const serverStore = useServerStore();

		const { hydrating } = toRefs(appStore);

		const brandStyle = computed(() => {
			return {
				'--brand': serverStore.info?.project?.project_color || 'var(--primary)',
			};
		});

		onMounted(() => startIdleTracking());
		onUnmounted(() => stopIdleTracking());

		watch([() => serverStore.info?.project?.project_color, () => serverStore.info?.project?.project_logo], () => {
			const hasCustomLogo = !!serverStore.info?.project?.project_logo;
			setFavicon(serverStore.info?.project?.project_color || '#00C897', hasCustomLogo);
		});

		watch(
			() => userStore.currentUser,
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
			() => serverStore.info?.project?.project_name,
			(projectName) => {
				document.title = projectName || 'Directus';
			}
		);

		async function setAppLanguage() {
			let lang = 'en-US'; // fallback language, if no language is set
			if (userStore.currentUser && userStore.currentUser.language) {
				// if user has set it's own language, prefer user language
				lang = userStore.currentUser.language;
			} else if (serverStore.info?.project?.project_language) {
				// otherwise use project language
				lang = serverStore.info.project.project_language;
			}
			await setLanguage(lang);
		}

		watch(
			() => appStore.hydrating,
			async () => {
				// initially set app language after hydration
				if (!appStore.hydrating) await setAppLanguage();
			}
		);

		watch(
			() => userStore.currentUser?.language,
			async (userLanguage) => {
				// set project language if user's language was reset to project language (null)
				if (!appStore.hydrating && !userLanguage) await setAppLanguage();
			}
		);

		watch(
			() => serverStore.info?.project?.project_language,
			async () => {
				await setAppLanguage();
			}
		);

		const customCSS = computed(() => {
			return serverStore.info?.project?.custom_css || '';
		});

		const error = computed(() => appStore.error);

		useSystem();

		return { t, hydrating, brandStyle, error, customCSS };
	},
});
</script>

<style lang="scss" scoped>
:global(#app) {
	height: 100%;
}

#directus {
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

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
