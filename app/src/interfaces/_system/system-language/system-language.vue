<template>
	<v-select
		:model-value="value"
		:items="languages"
		:disabled="disabled"
		:placeholder="t('language_placeholder')"
		@update:model-value="$emit('input', $event)"
	/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import availableLanguages from '@/lang/available-languages.yaml';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
		},
		includeProjectDefault: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['input'],
	setup(props) {
		const { t } = useI18n();

		const languages = Object.entries(availableLanguages).map(([key, value]) => ({
			text: value,
			value: key as string | null,
		}));

		if (props.includeProjectDefault) {
			languages.splice(0, 0, { text: t('fields.directus_settings.default_language'), value: null });
		}

		return { t, languages };
	},
});
</script>
