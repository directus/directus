<template>
	<v-select :model-value="value" :items="languages" :disabled="disabled" @update:model-value="$emit('input', $event)" />
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
	emits: ['input'],
	setup() {
		const languages = Object.entries(availableLanguages).map(([key, value]) => ({
			text: value,
			value: key,
		}));

		return { languages };
	},
});
</script>
