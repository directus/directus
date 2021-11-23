<template>
	<div
		ref="input"
		class="v-template-input"
		:class="{ multiline }"
		contenteditable="true"
		tabindex="1"
		@input="processText"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch, onMounted } from 'vue';
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

		onMounted(() => {
			if (props.modelValue && props.modelValue !== input.value!.innerText) {
				parseHTML(props.modelValue);
			}
		});

		return { processText, input };

		function processText(event: KeyboardEvent) {
			const input = event.target as HTMLDivElement;

			const caretPos = position(input).pos;

			const text = input.innerText ?? '';

			let endPos = text.indexOf(' ', caretPos);
			if (endPos == -1) endPos = text.length;
			const result = /\S+$/.exec(text.slice(0, endPos));
			let word = result ? result[0] : null;
			if (word) word = word.replace(/[\s'";:,./?\\-]$/, '');

			if (word?.startsWith(props.triggerCharacter)) {
				emit('trigger', { searchQuery: word.substring(props.triggerCharacter.length), caretPosition: caretPos });
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

		function parseHTML(innerText?: string) {
			if (!input.value) return;

			let newHTML = innerText ?? input.value.innerHTML ?? '';

			const caretPos = window.getSelection()?.rangeCount ? position(input.value).pos : 0;

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

			if (input.value.innerHTML !== newHTML) {
				input.value.innerHTML = newHTML;
				const delta = newHTML.length - input.value.innerHTML.length;

				const newPosition = caretPos + delta;

				if (newPosition >= newHTML.length || newPosition < 0) {
					position(input.value, newHTML.length - 1);
				} else {
					position(input.value, caretPos + delta);
				}
			}
		}
	},
});
</script>

<style scoped lang="scss">
.v-template-input {
	position: relative;
	height: var(--input-height);
	padding: var(--input-padding);
	padding-bottom: 32px;
	overflow: hidden;
	color: var(--foreground-normal);
	font-family: var(--family-sans-serif);
	white-space: nowrap;
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
	transition: border-color var(--fast) var(--transition);

	&.multiline {
		height: var(--input-height-tall);
		overflow-y: auto;
		white-space: pre-line;
	}

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&:focus-within {
		border-color: var(--primary);
	}

	:deep(.preview) {
		display: inline-block;
		margin: 2px;
		padding: 2px 4px;
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
