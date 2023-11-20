<script setup lang="ts">
import { useThemeConfiguration } from '@/composables/use-theme-configuration';
import { rulesToCssVars, useTheme } from '@directus/themes';
import { computed } from 'vue';

const props = defineProps<{
	darkMode: boolean;
	theme: string | null;
}>();

const { themeLightOverrides, themeDarkOverrides } = useThemeConfiguration();

const { theme } = useTheme(props.darkMode, props.theme, props.theme, themeLightOverrides, themeDarkOverrides);

const localVars = computed(() => {
	return rulesToCssVars(theme.value.rules);
});
</script>

<template>
	<div class="theme-preview" :style="localVars">
		<svg class="theme-preview" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
			<!-- Page Background -->
			<rect width="208" height="140" rx="4" fill="var(--theme--background)" />

			<!-- Header Bar -->
			<rect x="56" width="136" height="16" fill="var(--theme--header--background)" />

			<!-- Navigation Background -->
			<rect x="16" y="16" width="40" height="124" fill="var(--theme--navigation--background)" />

			<!-- Project Info Background -->
			<rect x="16" width="40" height="16" fill="var(--theme--navigation--project--background)" />

			<!-- Module Bar Background -->
			<rect width="16" height="140" fill="var(--theme--navigation--modules--background)" />

			<!-- Input -->
			<rect
				x="62.5"
				y="80.5"
				width="115"
				height="35"
				rx="3.5"
				fill="var(--theme--form--field--input--background)"
				stroke="var(--theme--form--field--input--border-color)"
			/>
			<rect
				x="62.5"
				y="44.5"
				width="55"
				height="11"
				rx="3.5"
				fill="var(--theme--form--field--input--background)"
				stroke="var(--theme--primary)"
			/>
			<rect
				x="122.5"
				y="44.5"
				width="55"
				height="11"
				rx="3.5"
				fill="var(--theme--form--field--input--background)"
				stroke="var(--theme--form--field--input--border-color)"
			/>

			<!-- Header Title -->
			<rect
				x="76"
				y="4"
				width="32"
				height="8"
				rx="4"
				fill="var(--theme--header--title--foreground)"
				fill-opacity="0.2"
			/>

			<!-- Field Label -->
			<rect
				x="62"
				y="32"
				width="24"
				height="8"
				rx="4"
				fill="var(--theme--form--field--label--foreground)"
				fill-opacity="0.2"
			/>
			<rect
				x="122"
				y="32"
				width="24"
				height="8"
				rx="4"
				fill="var(--theme--form--field--label--foreground)"
				fill-opacity="0.2"
			/>

			<rect
				x="62"
				y="68"
				width="32"
				height="8"
				rx="4"
				fill="var(--theme--form--field--label--foreground)"
				fill-opacity="0.2"
			/>

			<!-- Project Info Foreground -->
			<rect
				x="20"
				y="4"
				width="32"
				height="8"
				rx="4"
				fill="var(--theme--navigation--project--foreground)"
				fill-opacity="0.2"
			/>

			<!-- Navigation Item -->
			<rect x="20" y="20" width="24" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="20" y="32" width="32" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="20" y="44" width="24" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="20" y="68" width="32" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="20" y="56" width="24" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="20" y="80" width="24" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />

			<!-- Logo -->
			<rect width="16" height="16" fill="var(--theme--primary)" />
			<path
				d="M5.13866 13.0021L4.55769 12.7204L7.03502 8.77268L5.00164 7.78657C4.49039 7.53864 5.0131 7.24044 5.03285 7.22795C6.39997 6.21381 8.44813 4.7061 11.1828 2.69273L11.7637 2.97448L9.2864 6.92217L11.3256 7.9111C11.558 8.02379 11.6343 8.20058 11.3792 8.42257C7.2178 11.4726 5.13866 13.0021 5.13866 13.0021Z"
				fill="white"
			/>

			<!-- Module Bar Button Background Active -->
			<rect y="16" width="16" height="16" fill="var(--theme--navigation--modules--button--background-active)" />

			<!-- Module Bar Button Foreground Active -->
			<rect
				x="4"
				y="20"
				width="8"
				height="8"
				rx="4"
				fill="var(--theme--navigation--modules--button--foreground-active)"
			/>

			<!-- Module Bar Button Foreground -->
			<rect x="4" y="36" width="8" height="8" rx="4" fill="var(--theme--navigation--modules--button--foreground)" />
			<rect x="4" y="52" width="8" height="8" rx="4" fill="var(--theme--navigation--modules--button--foreground)" />
			<rect x="4" y="68" width="8" height="8" rx="4" fill="var(--theme--navigation--modules--button--foreground)" />

			<!-- Header Bar Buttons -->
			<rect x="62" y="4" width="8" height="8" rx="4" fill="var(--theme--background-normal)" />
			<rect x="170" y="4" width="8" height="8" rx="4" fill="var(--theme--primary)" />
			<rect x="156" y="4" width="8" height="8" rx="4" fill="var(--theme--background-normal)" />

			<!-- Sidebar Background -->
			<rect x="184" width="16" height="140" fill="var(--theme--sidebar--background)" />

			<!-- Sidebar Toggle Background -->
			<rect x="184" width="16" height="16" fill="var(--theme--sidebar--section--toggle--background)" />
			<rect x="184" y="16" width="16" height="16" fill="var(--theme--sidebar--section--toggle--background)" />
			<rect x="184" y="32" width="16" height="16" fill="var(--theme--sidebar--section--toggle--background)" />

			<!-- Sidebar Toggle Foreground -->
			<rect
				x="188"
				y="4"
				width="8"
				height="8"
				rx="4"
				fill="var(--theme--sidebar--section--toggle--foreground)"
				fill-opacity="0.2"
			/>
			<rect
				x="188"
				y="20"
				width="8"
				height="8"
				rx="4"
				fill="var(--theme--sidebar--section--toggle--foreground)"
				fill-opacity="0.2"
			/>
			<rect
				x="188"
				y="36"
				width="8"
				height="8"
				rx="4"
				fill="var(--theme--sidebar--section--toggle--foreground)"
				fill-opacity="0.2"
			/>

			<!-- Header Border -->
			<rect x="56" y="16" width="128" height="1" fill="var(--theme--header--border-color)" />
		</svg>
	</div>
</template>

<style scoped lang="scss">
.theme-preview {
	svg {
		width: 100%;
		border: 1px solid var(--theme--border-color-subdued);
		border-radius: 4px;
	}
}
</style>
