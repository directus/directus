<script setup lang="ts">
import { useThemeStore } from '@directus/themes';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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

const { t } = useI18n();

const valueWithDefault = computed(() => props.value ?? themeStore.themes[props.appearance][0]?.name ?? null);
</script>

<template>
	<v-select
		:model-value="valueWithDefault"
		:disabled="disabled"
		:items="items"
		:placeholder="t('select_a_theme')"
		@update:model-value="$emit('input', $event)"
	/>
</template>
