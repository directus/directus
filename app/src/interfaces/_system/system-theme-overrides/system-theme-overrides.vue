<script setup lang="ts">
import { useThemeConfiguration } from '@/composables/use-theme-configuration';
import { Theme, useTheme } from '@directus/themes';
import { clone, get, isEmpty, setWith, unset } from 'lodash';
import { computed } from 'vue';
import SystemThemeOverridesGroup from './system-theme-overrides-group.vue';
import type { SetValueFn } from './types.js';

defineOptions({
	inheritAttrs: false,
});

const props = defineProps<{
	value: Record<string, unknown> | null;
	appearance: 'dark' | 'light';
}>();

const emit = defineEmits<{
	input: [Partial<Theme> | null];
}>();

const set: SetValueFn = (path: string[], value: string) => {
	if (value.length === 0) {
		const clonedVal = clone(props.value ?? {});

		unset(clonedVal, path);

		/**
		 * loop backwards over the path, making sure to unset empty objects as we go up the tree to
		 * cleanup the stored value
		 */
		while (--path.length && isEmpty(get(clonedVal, path))) {
			unset(clonedVal, path);
		}

		emit('input', clonedVal);
	} else {
		emit('input', setWith(clone(props.value ?? {}), path, value, clone));
	}
};

const { themeDark, themeLight } = useThemeConfiguration();

const darkMode = computed(() => props.appearance === 'dark');

const { theme } = useTheme(darkMode, themeLight, themeDark, {}, {});
</script>

<template>
	<div class="theme-overrides">
		<SystemThemeOverridesGroup root :rules="theme.rules" :path="[]" :value="value ?? {}" :set="set" />
	</div>
</template>

<style scoped lang="scss">
.theme-overrides {
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	padding: var(--theme--form--field--input--padding);
	border-radius: var(--theme--border-radius);
	max-height: var(--input-height-max);
	overflow-y: auto;
	background-color: var(--theme--form--field--input--background);
	transition-duration: var(--fast);
	transition-timing-function: var(--transition);
	transition-property: box-shadow, border-color;

	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
		box-shadow: var(--theme--form--field--input--box-shadow-hover);
	}

	&:focus-within {
		border-color: var(--theme--form--field--input--border-color-focus);
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}
</style>
