<template>
	<div class="v-template-input" :class="{ multiline }" contenteditable="true" @input="processText" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { position } from 'caret-pos';

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
		return { processText };

		function processText(event: KeyboardEvent) {
			const input = event.target as HTMLDivElement;

			let newHTML = input.innerHTML;

			const matches = newHTML.match(props.regex);

			if (matches) {
				const caretPos = position(input).pos;

				for (const match of matches ?? []) {
					newHTML = newHTML.replace(
						new RegExp(`(${match})(?!</button>)`),
						` <button class="preview" data-preview="Preview Text" contenteditable="false">${match}</button> `
					);
				}

				input.innerHTML = newHTML;

				position(input, caretPos + 2);
			}

			emit('update:modelValue', input.innerText);
		}
	},
});
</script>

<style scoped lang="scss">
.v-template-input {
	min-height: var(--input-height-tall);
	padding: var(--input-padding);
	color: var(--foreground-normal);
	font-family: var(--family-sans-serif);
	white-space: pre-wrap;
	word-wrap: normal;
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
			display: block;
			font-size: 1rem;
			content: attr(data-preview);
		}
	}
}
</style>
