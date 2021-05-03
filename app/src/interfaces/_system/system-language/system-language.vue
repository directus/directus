<template>
	<v-select @update:modelValue="$attrs.onInput" :modelValue="value" :items="languages" :disabled="disabled" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
	setup() {
		const languages = Object.entries(availableLanguages).map(([key, value]) => ({
			text: value,
			value: key,
		}));

		return { languages };
	},
});
</script>
