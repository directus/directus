<script setup lang="ts">
import { useThemeStore } from '@directus/themes';
import { computed } from 'vue';
import ThemePreview from './theme-preview.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useServerStore } from '@/stores/server';
import { translate } from '@/utils/translate-literal';

defineEmits<{
	input: [string | null];
}>();

const props = defineProps<{
	appearance: 'dark' | 'light';
	value: string | null;
	disabled: boolean;
	includeNull?: boolean;
}>();

const serverStore = useServerStore();
const themeStore = useThemeStore();

const systemTheme = computed(() => {
	const theme =
		props.appearance === 'dark'
			? serverStore.info.project?.default_theme_dark
			: serverStore.info.project?.default_theme_light;

	return theme ?? null;
});

const items = computed(() => themeStore.themes[props.appearance].map((theme) => ({ id: theme.id, name: theme.name })));

const valueWithDefault = computed(() => {
	if (props.includeNull) {
		return props.value;
	}

	return props.value ?? themeStore.themes[props.appearance][0]?.name ?? null;
});
</script>

<template>
	<div class="interface-system-theme">
		<template v-if="includeNull">
			<button :class="{ active: value === null }" class="theme" @click="$emit('input', null)">
				<ThemePreview :dark-mode="appearance === 'dark'" :theme="systemTheme" />

				<div class="label">
					<VIcon :name="value === null ? 'radio_button_checked' : 'radio_button_unchecked'" />
					<VTextOverflow :text="$t('default_sync_with_project')" />
				</div>
			</button>
		</template>

		<button
			v-for="theme of items"
			:key="theme.id"
			:class="{ active: theme.id === valueWithDefault }"
			class="theme"
			@click="$emit('input', theme.id)"
		>
			<ThemePreview :dark-mode="appearance === 'dark'" :theme="theme.id" />

			<div class="label">
				<VIcon :name="theme.id === valueWithDefault ? 'radio_button_checked' : 'radio_button_unchecked'" />
				<VTextOverflow :text="translate(theme.name)" />
			</div>
		</button>
	</div>
</template>

<style scoped lang="scss">
.interface-system-theme {
	display: grid;
	gap: 24px;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
	text-align: start;

	--v-icon-color: var(--theme--primary);

	.label {
		display: flex;
		align-items: center;

		.v-icon {
			margin-inline-end: 4px;
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
