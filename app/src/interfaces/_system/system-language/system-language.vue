<template>
	<v-select @update:model-value="$emit('input', $event)" :model-value="value" :items="languages" :disabled="disabled" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import availableLanguages from '@/lang/available-languages.yaml';

export default defineComponent({
	emits: ['input'],
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
