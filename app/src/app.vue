<script setup lang="ts">
import { useSystem } from '@/composables/use-system';
import { useServerStore } from '@/stores/server';
import { generateFavicon } from '@/utils/generate-favicon';
import { useAppStore } from '@directus/stores';
import { ThemeProvider } from '@directus/themes';
import { useHead } from '@unhead/vue';
import { computed, onMounted, onUnmounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemeConfiguration } from './composables/use-theme-configuration';
import { startIdleTracking, stopIdleTracking } from './idle';

const { t } = useI18n();

const appStore = useAppStore();
const serverStore = useServerStore();

const { darkMode, themeDark, themeDarkOverrides, themeLight, themeLightOverrides } = useThemeConfiguration();

const { hydrating } = toRefs(appStore);

const brandStyleCss = computed(() => {
	return `:root { --project-color: ${serverStore.info?.project?.project_color ?? 'var(--theme--primary)'} }`;
});

useHead({
	style: [{ textContent: brandStyleCss }],
	titleTemplate: computed((title?: string) => {
		const projectName = serverStore.info?.project?.project_name ?? 'Directus';
		return !title ? projectName : `${title} · ${projectName}`;
	}),
	meta: computed(() => {
		const content = serverStore.info?.project?.project_color ?? '#6644ff';

		return [
			{
				name: 'msapplication-TileColor',
				content,
			},
			{
				name: 'theme-color',
				content,
			},
		];
	}),
	link: computed(() => {
		let href: string;

		if (serverStore.info?.project?.public_favicon) {
			href = `/assets/${serverStore.info.project.public_favicon}`;
		} else if (serverStore.info?.project?.project_color) {
			href = generateFavicon(serverStore.info.project.project_color, !!serverStore.info.project.project_logo === false);
		} else {
			href = '/favicon.ico';
		}

		return [
			{
				rel: 'icon',
				href,
			},
		];
	}),
	bodyAttrs: computed(() => ({ class: [darkMode.value ? 'dark' : 'light'] })),
});

onMounted(() => startIdleTracking());
onUnmounted(() => stopIdleTracking());

const customCSS = computed(() => {
	return serverStore.info?.project?.custom_css || '';
});

const error = computed(() => appStore.error);

useSystem();
</script>

<template>
	<ThemeProvider
		:dark-mode="darkMode"
		:theme-light="themeLight"
		:theme-dark="themeDark"
		:theme-light-overrides="themeLightOverrides"
		:theme-dark-overrides="themeDarkOverrides"
	/>

	<div id="directus">
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
	</div>

	<teleport to="#custom-css">{{ customCSS }}</teleport>
</template>

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
