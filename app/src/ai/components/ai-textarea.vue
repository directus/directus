<script setup lang="ts">
import { useTextareaAutosize } from '@vueuse/core'
import { useTemplateRef } from 'vue';

const modelValue = defineModel<string | undefined>();

interface Props {
	placeholder?: string;
	disabled?: boolean;
	rows?: number;
	maxRows?: number;
}

withDefaults(defineProps<Props>(), {
	rows: 1,
});

const emit = defineEmits<{
	focus: [event: FocusEvent];
	blur: [event: FocusEvent];
}>();

const textareaRef = useTemplateRef<HTMLTextAreaElement>('textarea-ref');
useTextareaAutosize({ input: modelValue.value, element: textareaRef })

function onFocus(event: FocusEvent) {
	emit('focus', event);
}

function onBlur(event: FocusEvent) {
	emit('blur', event);
}

defineExpose({
	textareaRef,
});
</script>

<template>
	<textarea
		ref="textarea-ref"
		v-model="modelValue"
		:placeholder="placeholder"
		:disabled
		:rows="rows"
		class="ai-textarea"
		@focus="onFocus"
		@blur="onBlur"
	/>
</template>

<style scoped>
.ai-textarea {
	inline-size: 100%;
	padding: 0;
	border: none;
	background: none;
	color: var(--theme--form--field--input--foreground);
	font-family: var(--theme--fonts--sans--font-family);
	font-size: 14px;
	line-height: 1.5;
	resize: none;

	&:focus {
		outline: none;
	}

	&:disabled {
		opacity: var(--theme--form--field--input--opacity-disabled);
		cursor: not-allowed;
	}

	&::placeholder {
		color: var(--theme--foreground-subdued);
	}

	max-block-size: 120px;
}
</style>
