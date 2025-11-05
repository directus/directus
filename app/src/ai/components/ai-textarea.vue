<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';

const modelValue = defineModel<string | undefined>();

interface Props {
	placeholder?: string;
	disabled?: boolean;
	rows?: number;
	maxRows?: number;
}

const props = withDefaults(defineProps<Props>(), {
	rows: 1,
	maxRows: 8,
});

const emit = defineEmits<{
	focus: [event: FocusEvent];
	blur: [event: FocusEvent];
}>();

const textareaRef = ref<HTMLTextAreaElement>();

function onFocus(event: FocusEvent) {
	emit('focus', event);
}

function onBlur(event: FocusEvent) {
	emit('blur', event);
}

function autoResize() {
	if (!textareaRef.value) return;

	// Reset to base rows
	textareaRef.value.rows = props.rows;

	// Hide overflow to get accurate scrollHeight
	const overflow = textareaRef.value.style.overflow;
	textareaRef.value.style.overflow = 'hidden';

	const styles = window.getComputedStyle(textareaRef.value);
	const paddingTop = Number.parseInt(styles.paddingTop);
	const paddingBottom = Number.parseInt(styles.paddingBottom);
	const padding = paddingTop + paddingBottom;
	const lineHeight = Number.parseInt(styles.lineHeight);
	const { scrollHeight } = textareaRef.value;

	const newRows = (scrollHeight - padding) / lineHeight;

	if (newRows > props.rows) {
		textareaRef.value.rows = Math.min(newRows, props.maxRows);
	}

	// Restore overflow
	textareaRef.value.style.overflow = overflow;
}

watch(modelValue, () => {
	nextTick(autoResize);
});

onMounted(() => {
	autoResize();
});

defineExpose({
	textareaRef,
});
</script>

<template>
	<textarea
		ref="textareaRef"
		v-model="modelValue"
		:placeholder="placeholder"
		:disabled="disabled"
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
		opacity: 0.5;
		cursor: not-allowed;
	}

	&::placeholder {
		color: var(--theme--foreground-subdued);
	}
}
</style>
