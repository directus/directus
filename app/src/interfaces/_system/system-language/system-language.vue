<script setup lang="ts">
import VSelect from '@/components/v-select/v-select.vue';
import availableLanguages from '@/lang/available-languages.yaml';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	disabled?: boolean;
	includeProjectDefault?: boolean;
}>();

defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

const languages = Object.entries(availableLanguages).map(([key, value]) => ({
	text: value,
	value: key as string | null,
}));

if (props.includeProjectDefault) {
	languages.splice(0, 0, { text: t('fields.directus_settings.default_language'), value: null });
}
</script>

<template>
	<v-select
		:model-value="value"
		:items="languages"
		:disabled="disabled"
		:placeholder="$t('language_placeholder')"
		@update:model-value="$emit('input', $event)"
	/>
</template>
