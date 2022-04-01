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
	},
	emits: ['input'],
	setup() {
		const { t } = useI18n();

		const languages = Object.entries(availableLanguages).map(([key, value]) => ({
			text: value,
			value: key,
		}));

		return { t, languages };
	},
});
</script>
