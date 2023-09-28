<script setup lang="ts">
export interface ThemeProviderProps {
	appearance: 'light' | 'dark' | 'auto';
	themeLight?: string;
	themeDark?: string;
}

withDefaults(defineProps<ThemeProviderProps>(), {
	themeLight: 'default',
	themeDark: 'default',
});
</script>

<template>
	<div class="theme-provider"><slot /></div>
</template>
