<script setup lang="ts">
import { rulesToCssVars, useThemeStore } from '@directus/themes';
import { pick } from 'lodash';
import { computed } from 'vue';

const props = defineProps<{
	darkMode: boolean;
	theme: string;
}>();

const themeStore = useThemeStore();

const theme = computed(() => {
	const appearance = props.darkMode ? 'dark' : 'light';

	const theme = themeStore.themes[appearance].find((theme) => theme.name === props.theme);

	return theme ?? null;
});

const rules = computed(() => {
	const rules = theme.value?.rules;

	if (!rules) return null;

	return rules;
});

const localVars = computed(() => {
	return rulesToCssVars(rules.value);
});
</script>

<template>
	<div class="theme-preview" :style="localVars">
		<v-icon v-if="!rules" name="warning" />

		<svg v-else class="theme-preview" viewBox="0 0 210 142" fill="none" xmlns="http://www.w3.org/2000/svg">
			<!-- Page Background -->
			<rect x="1" y="1" width="208" height="140" rx="4" fill="var(--theme--background-page)" />

			<!-- Header Bar -->
			<rect x="57" y="1" width="136" height="16" fill="var(--theme--header--background)" />

			<!-- Navigation Background -->
			<path d="M17 1H57V141H17V1Z" fill="var(--theme--navigation--background)" />

			<!-- Project Info Background -->
			<path d="M17 1H57V17H17V1Z" fill="var(--theme--navigation--project--background)" />

			<!-- Module Bar Background -->
			<path
				d="M1.5 5C1.5 3.067 3.067 1.5 5 1.5H16.5V140.5H5C3.067 140.5 1.5 138.933 1.5 137V5Z"
				fill="var(--theme--navigation--modules--background)"
				stroke="var(--theme--navigation--modules--background)"
			/>

			<!-- Input -->
			<rect x="63.5" y="81.5" width="123" height="35" rx="3.5" fill="var(--theme--form--field--input--background)" stroke="var(--theme--form--field--input--border-color)" />
			<rect x="63.5" y="45.5" width="59" height="11" rx="3.5" fill="var(--theme--form--field--input--background)" stroke="var(--theme--primary)" />
			<rect x="127.5" y="45.5" width="59" height="11" rx="3.5" fill="var(--theme--form--field--input--background)" stroke="var(--theme--form--field--input--border-color)" />

			<!-- Field Label -->
			<rect x="63" y="33" width="24" height="8" rx="4" fill="var(--theme--form--field--label--foreground)" fill-opacity="0.2" />
			<rect x="63" y="69" width="32" height="8" rx="4" fill="var(--theme--form--field--label--foreground)" fill-opacity="0.2" />
			<rect x="127" y="33" width="24" height="8" rx="4" fill="var(--theme--form--field--label--foreground)" fill-opacity="0.2" />

			<rect x="77" y="5" width="32" height="8" rx="4" fill="#172940" fill-opacity="0.2" />

			<!-- Project Info Foreground -->
			<rect x="21" y="5" width="32" height="8" rx="4" fill="var(--theme--navigation--project--foreground)" fill-opacity="0.2" />

			<!-- Navigation Item -->
			<rect x="21" y="21" width="24" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="21" y="33" width="32" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="21" y="45" width="24" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="21" y="57" width="24" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="21" y="69" width="32" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />
			<rect x="21" y="81" width="24" height="8" rx="4" fill="var(--theme--navigation--list--background-active)" />

			<!-- Logo -->
			<path d="M1 5C1 2.79086 2.79086 1 5 1H17V17H1V5Z" fill="var(--theme--primary)" />
			<path
				d="M6.3442 14.0021L5.74 13.7204L8.31642 9.77268L6.2017 8.78657C5.67 8.53864 6.21363 8.24044 6.23416 8.22795C7.65597 7.21381 9.78606 5.7061 12.6301 3.69273L13.2343 3.97448L10.6579 7.92217L12.7786 8.9111C13.0203 9.02379 13.0997 9.20058 12.8343 9.42257C8.50651 12.4726 6.3442 14.0021 6.3442 14.0021Z"
				fill="white"
			/>

			<!-- Module Bar Button Background Active -->
			<rect x="1" y="17" width="16" height="16" fill="var(--theme--navigation--modules--button--background-active)" />

			<!-- Module Bar Button Foreground Active -->
			<rect x="5" y="21" width="8" height="8" rx="4" fill="var(--theme--navigation--modules--button--foreground-active)" />

			<!-- Module Bar Button Foreground -->
			<rect x="5" y="37" width="8" height="8" rx="4" fill="var(--theme--navigation--modules--button--foreground)" />
			<rect x="5" y="53" width="8" height="8" rx="4" fill="var(--theme--navigation--modules--button--foreground)" />
			<rect x="5" y="69" width="8" height="8" rx="4" fill="var(--theme--navigation--modules--button--foreground)" />

			<!-- Header Bar Buttons -->
			<rect x="63" y="5" width="8" height="8" rx="4" fill="var(--theme--background)" />
			<rect x="179" y="5" width="8" height="8" rx="4" fill="var(--theme--primary)" />
			<rect x="165" y="5" width="8" height="8" rx="4" fill="var(--theme--background)" />

			<!-- Sidebar Background -->
			<path d="M193 1H205C207.209 1 209 2.79086 209 5V137C209 139.209 207.209 141 205 141H193V1Z" fill="var(--theme--sidebar--background)" />

			<!-- Sidebar Toggle Background -->
			<path d="M193 1H205C207.209 1 209 2.79086 209 5V17H193V1Z" fill="var(--theme--sidebar--section--toggle--background)" />
			<path d="M193 17H209V33H193V17Z" fill="var(--theme--sidebar--section--toggle--background)" />
			<path d="M193 33H209V49H193V33Z" fill="var(--theme--sidebar--section--toggle--background)" />

			<!-- Sidebar Toggle Foreground -->
			<rect x="197" y="5" width="8" height="8" rx="4" fill="var(--theme--sidebar--section--toggle--foreground)" fill-opacity="0.2" />
			<rect x="197" y="21" width="8" height="8" rx="4" fill="var(--theme--sidebar--section--toggle--foreground)" fill-opacity="0.2" />
			<rect x="197" y="37" width="8" height="8" rx="4" fill="var(--theme--sidebar--section--toggle--foreground)" fill-opacity="0.2" />

			<!-- Header Border -->
			<rect x="57" y="17" width="136" height="1" fill="var(--theme--header--border-color)" />
		</svg>
	</div>
</template>

<style scoped lang="scss">
.theme-preview {
	svg {
		width: 100%;
	}
}
</style>
