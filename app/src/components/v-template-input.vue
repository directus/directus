<template>
	<div class="v-template-input" :class="{ multiline }" contenteditable="true" @input="onInput" />
</template>

<script lang="ts">
import { userName } from '@/utils/user-name';
import { defineComponent } from 'vue';

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
		activator: {
			type: Boolean,
			default: false,
		},
		insertionFn: {
			type: Function,
			default: (match: Element) => {
				return match;
			},
		},
	},
	emits: ['update:modelValue', 'update:activator'],
	setup(props, { emit }) {
		return { onInput };

		function onInput(event: InputEvent) {
			const input = event.target as HTMLDivElement;

			const textContent = input.innerText;

			emit('update:modelValue', textContent);

			// Loop over every child element recursively
			// Ignore "button" with predefined class ('preview'?) add an attribute
			// Replace inner text of element with wrapped button when regex is encountered
			// Use whatever is in use-template.ts for inspiration
			// we want to set the button innertext in a selectOption() function
			// this regex match should fire that function instead of creating the button right away
			replaceDeep(input);
		}

		function replaceDeep(parent: HTMLElement | Element): void {
			if (parent.tagName === 'BUTTON' && parent.hasAttribute('dataset-preview')) return;

			if (parent.children.length === 0 || parent.children[0].tagName === 'BR') {
				parent.innerHTML.split(props.regex).forEach(async (part) => {
					if (props.regex.test(part)) {
						// element needs to be returned in here so that we know where to insert the element.
						// insertionFn() needs to pause and allow the user to select from the drop down.

						parent.appendChild(await props.insertionFn(part));
					}
				});
				return;
			}

			for (const child of parent.children) {
				if (child.children.length > 0) {
					replaceDeep(child);
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
