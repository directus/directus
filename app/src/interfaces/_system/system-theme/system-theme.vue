<script setup lang="ts">
import { useThemeStore } from '@directus/themes';
import { computed } from 'vue';
import ThemePreview from './theme-preview.vue';

defineEmits<{
	input: [string | null];
}>();

const props = defineProps<{
	appearance: 'dark' | 'light';
	value: string | null;
	disabled: boolean;
}>();

const themeStore = useThemeStore();

const items = computed(() => themeStore.themes[props.appearance].map((theme) => theme.name));

const valueWithDefault = computed(() => props.value ?? themeStore.themes[props.appearance][0]?.name ?? null);
</script>

<template>
	<div class="interface-system-theme">
		<button
			v-for="theme of items"
			:key="theme"
			:class="{ active: theme === valueWithDefault }"
			class="theme"
			@click="$emit('input', theme)"
		>
			<ThemePreview :dark-mode="appearance === 'dark'" :theme="theme" />

			<div class="label">
				<v-icon :name="theme === valueWithDefault ? 'radio_button_checked' : 'radio_button_unchecked'" />
				{{ theme }}
			</div>
		</button>
	</div>
</template>

<style scoped lang="scss">
.interface-system-theme {
	display: grid;
	grid-template-columns: repeat(auto-fit, 240px);
	gap: 36px;
}

.theme {
	background-color: var(--theme--form--field--input--background);
	padding: 10px;
	border-width: var(--theme--border-width);
	border-style: solid;
	border-color: var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	color: var(--theme--form--field--input--foreground);
	box-shadow: var(--theme--form--field--input--box-shadow);
	transition-duration: var(--fast);
	transition-property: background-color, border-color, box-shadow;
	transition-timing-function: var(--ease-out);
	text-align: left;

	--v-icon-color: var(--theme--primary);

	.label {
		display: flex;
		align-items: center;

		.v-icon {
			margin-right: 4px;
		}
	}

	&:hover {
		background-color: var(--theme--form--field--input--background);
		border-color: var(--v-input-border-color-hover, var(--theme--form--field--input--border-color-hover));
		box-shadow: var(--theme--form--field--input--box-shadow-hover);
	}

	&.active {
		background-color: var(--theme--form--field--input--background);
		border-color: var(--theme--form--field--input--border-color-focus);
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}
</style>
