<template>
	<div ref="input" class="v-template-input" :class="{ multiline }" contenteditable="true" @input="processText" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue';
import { position } from 'caret-pos';

export default defineComponent({
	props: {
		modelValue: {
			type: String,
			default: null,
		},
		captureGroup: {
			type: String,
			required: true,
		},
		multiline: {
			type: Boolean,
			default: false,
		},
		triggerCharacter: {
			type: String,
			required: true,
		},
		items: {
			type: Object as PropType<Record<string, string>>,
			required: true,
		},
	},
	emits: ['update:modelValue', 'trigger', 'deactivate'],
	setup(props, { emit }) {
		const input = ref<HTMLDivElement>();

		let hasTriggered = false;

		watch(
			() => props.modelValue,
			(newText) => {
				if (!input.value) return;

				if (newText !== input.value.innerText) {
					parseHTML(newText);
				}
			}
		);

		return { processText, input };

		function processText(event: KeyboardEvent) {
			const input = event.target as HTMLDivElement;

			const caretPos = position(input).pos;

			const text = input.innerText ?? '';

			let word = '';
			let countBefore = caretPos - 1;
			let countAfter = caretPos;

			if (text.charAt(countBefore) !== ' ') {
				while (countBefore >= 0 && text.charAt(countBefore) !== ' ') {
					word = text.charAt(countBefore) + word;
					countBefore--;
				}
			}

			while (countAfter < text.length && text.charAt(countAfter) !== ' ') {
				word = word + text.charAt(countAfter);
				countAfter++;
			}

			if (word.startsWith(props.triggerCharacter)) {
				emit('trigger', word.substring(props.triggerCharacter.length));
				hasTriggered = true;
			} else {
				if (hasTriggered) {
					emit('deactivate');
					hasTriggered = false;
				}
			}

			parseHTML();

			emit('update:modelValue', input.innerText);
		}

		function parseHTML(textContent?: string) {
			if (!input.value) return;

			let newHTML = textContent ?? input.value.innerHTML;

			const caretPos = position(input.value).pos;

			const matches = newHTML.match(new RegExp(`${props.captureGroup}(?!</mark>)`, 'gi'));

			if (matches) {
				for (const match of matches ?? []) {
					newHTML = newHTML.replace(
						new RegExp(`(${match})(?!</mark>)`),
						`&nbsp;<mark class="preview" data-preview="${
							props.items[match.substring(props.triggerCharacter.length)]
						}" contenteditable="false">${match}</mark>&nbsp;`
					);
				}
			}

			input.value.innerHTML = newHTML;

			position(input.value, caretPos);
		}
	},
});
</script>

<style scoped lang="scss">
.v-template-input {
	min-height: var(--input-height);
	max-height: 350px;
	padding: var(--input-padding);
	overflow: hidden;
	color: var(--foreground-normal);
	font-family: var(--family-sans-serif);
	white-space: nowrap;
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
	transition: border-color var(--fast) var(--transition);

	&.multiline {
		min-height: var(--input-height-tall);
		overflow-y: auto;
		white-space: normal;
	}

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&:focus-within {
		border-color: var(--primary);
	}

	:deep(.preview) {
		display: inline-block;
		padding: 4px 8px;
		color: var(--primary);
		font-size: 0;
		line-height: 1;
		vertical-align: -2px;
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
