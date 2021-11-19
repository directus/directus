<template>
	<div class="v-template-input" :class="{ multiline }" contenteditable="true" @input="onInput" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import dompurify from 'dompurify';

export default defineComponent({
	props: {
		modelValue: {
			type: String,
			default: null,
		},
		regex: {
			type: RegExp,
			required: true,
		},
		multiline: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return { onInput };

		function onInput(event: InputEvent) {
			const input = event.target as HTMLDivElement;

			const textContent = input.innerText;

			emit('update:modelValue', textContent);

			// Loop over every child element recursively
			// Ignore "button" with predefined class ('preview'?)
			// Replace inner text of element with wrapped button when regex is encountered
			// Use whatever is in use-template.ts for inspiration
			replaceDeep(input.children);
		}

		function replaceDeep(children: HTMLCollection) {
			for (const child of children) {
				if (child.children) {
					replaceDeep(children);
				}
			}
		}
	},
});
</script>

<style scoped lang="scss">
.v-template-input {
	min-height: var(--input-height);
	padding: var(--input-padding);
	color: var(--foreground-normal);
	font-family: var(--family-sans-serif);
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
	transition: border-color var(--fast) var(--transition);

	&.multiline {
		min-height: var(--input-height-tall);
	}

	:deep(.preview) {
		padding: 4px 8px;
		color: var(--primary);
		font-size: 0;
		line-height: 1;
		background: var(--primary-alt);
		border-radius: var(--border-radius);
		user-select: text;

		&::before {
			font-size: 1rem;
			content: attr(data-preview);
		}
	}
}
</style>
