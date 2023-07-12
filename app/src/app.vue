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

<script setup lang="ts">
import { useSystem } from '@/composables/use-system';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { setFavicon } from '@/utils/set-favicon';
import { useAppStore } from '@directus/stores';
import type { User } from '@directus/types';
import { useHead } from '@unhead/vue';
import { StyleValue, computed, onMounted, onUnmounted, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { startIdleTracking, stopIdleTracking } from './idle';

const { t } = useI18n();

const appStore = useAppStore();
const userStore = useUserStore();
const serverStore = useServerStore();

const { hydrating } = toRefs(appStore);

const brandStyle = computed(() => {
	return {
		'--brand': serverStore.info?.project?.project_color || 'var(--primary)',
	} as StyleValue;
});

useHead({
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
});

onMounted(() => startIdleTracking());
onUnmounted(() => stopIdleTracking());

watch(
	[() => serverStore.info?.project?.project_color ?? null, () => serverStore.info?.project?.project_logo ?? null],
	() => {
		const hasCustomLogo = !!serverStore.info?.project?.project_logo;
		setFavicon(serverStore.info?.project?.project_color, hasCustomLogo);
	},
	{ immediate: true }
);

watch(
	() => (userStore.currentUser as User)?.theme,
	(theme) => {
		document.body.classList.remove('dark');
		document.body.classList.remove('light');
		document.body.classList.remove('auto');

		if (theme) {
			document.body.classList.add(theme);

			document
				.querySelector('head meta[name="theme-color"]')
				?.setAttribute('content', theme === 'light' ? '#ffffff' : '#263238');
		} else {
			// Default to auto mode
			document.body.classList.add('auto');
		}
	},
	{ immediate: true }
);

const customCSS = computed(() => {
	return serverStore.info?.project?.custom_css || '';
});

const error = computed(() => appStore.error);

useSystem();
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
