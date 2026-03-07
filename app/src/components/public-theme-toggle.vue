<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'directus-public-theme';

const mode = ref<ThemeMode>('auto');

const systemDark = ref(false);
let mediaQuery: MediaQueryList | null = null;

function onSystemChange(e: MediaQueryListEvent) {
	systemDark.value = e.matches;
}

onMounted(() => {
	const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;

	if (saved && ['light', 'dark', 'auto'].includes(saved)) {
		mode.value = saved;
	}

	mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	systemDark.value = mediaQuery.matches;
	mediaQuery.addEventListener('change', onSystemChange);
});

onUnmounted(() => {
	mediaQuery?.removeEventListener('change', onSystemChange);
});

const resolvedTheme = computed(() => {
	if (mode.value === 'auto') return systemDark.value ? 'dark' : 'light';
	return mode.value;
});

const icon = computed(() => {
	const icons: Record<ThemeMode, string> = {
		light: 'light_mode',
		dark: 'dark_mode',
		auto: 'brightness_auto',
	};

	return icons[mode.value];
});

const label = computed(() => {
	const labels: Record<ThemeMode, string> = {
		light: 'Light mode',
		dark: 'Dark mode',
		auto: 'System theme',
	};

	return labels[mode.value];
});

function cycle() {
	const order: ThemeMode[] = ['light', 'dark', 'auto'];
	const idx = order.indexOf(mode.value);
	mode.value = order[(idx + 1) % order.length]!;
	localStorage.setItem(STORAGE_KEY, mode.value);
}

watch(
	resolvedTheme,
	(theme) => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document.documentElement.classList.toggle('light', theme === 'light');
	},
	{ immediate: true },
);
</script>

<template>
	<button class="public-theme-toggle" :title="label" @click="cycle">
		<VIcon :name="icon" />
	</button>
</template>

<style scoped>
.public-theme-toggle {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 40px;
	block-size: 40px;
	border: 1px solid var(--theme--border-color, #e0e0e0);
	border-radius: var(--theme--border-radius, 8px);
	background: transparent;
	color: var(--theme--foreground-subdued, #999);
	cursor: pointer;
	transition: color 150ms ease, border-color 150ms ease;
}

.public-theme-toggle:hover {
	color: var(--theme--foreground, #333);
	border-color: var(--theme--foreground-subdued, #666);
}
</style>
