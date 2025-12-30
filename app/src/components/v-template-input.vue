<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { position } from 'caret-pos';
import { onMounted, ref, watch } from 'vue';

interface Props {
	captureGroup: string;
	triggerCharacter: string;
	items: Record<string, string>;
	modelValue?: string;
	multiline?: boolean;
	placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	multiline: false,
	placeholder: undefined,
});

const emit = defineEmits(['update:modelValue', 'trigger', 'deactivate', 'up', 'down', 'enter']);

type HTMLEditableDivElement = HTMLDivElement & Pick<HTMLInputElement, 'value'>;

const input = ref<HTMLEditableDivElement | null>(null);

let hasTriggered = false;
let matchedPositions: number[] = [];
let previousInnerTextLength = 0;
let previousCaretPos = 0;

watch(
	() => props.modelValue,
	(newText) => {
		if (!input.value) return;

		if (newText !== input.value.innerText) {
			parseHTML(newText, true);
		}
	},
);

onMounted(() => {
	if (props.modelValue && props.modelValue !== input.value?.innerText) {
		parseHTML(props.modelValue);
	}
});

useEventListener(input, 'click', checkClick);
useEventListener(input, 'keydown', checkKeyDown);
useEventListener(input, 'keyup', checkKeyUp);

function checkClick(event: MouseEvent) {
	const input = event.target as HTMLEditableDivElement;

	const caretPos = window.getSelection()?.rangeCount ? position(input).pos : 0;

	const checkCaretPos = matchedPositions.indexOf(caretPos);

	if (checkCaretPos !== -1) {
		if (checkCaretPos % 2 === 0) {
			position(input, caretPos - 1);
		} else {
			position(input, caretPos + 1);
		}

		event.preventDefault();
	}
}

function checkKeyDown(event: KeyboardEvent) {
	const input = event.target as HTMLEditableDivElement;

	const caretPos = window.getSelection()?.rangeCount ? position(input).pos : 0;

	if (event.code === 'Enter') {
		event.preventDefault();

		if (hasTriggered) {
			emit('enter');
		} else {
			parseHTML(
				input.innerText.substring(0, caretPos) +
					(caretPos === input.innerText.length && input.innerText.charAt(caretPos - 1) !== '\n' ? '\n\n' : '\n') +
					input.innerText.substring(caretPos),
				true,
			);

			position(input, caretPos + 1);
		}
	} else if (event.code === 'ArrowUp' && !event.shiftKey) {
		if (hasTriggered) {
			event.preventDefault();

			emit('up');
		}
	} else if (event.code === 'ArrowDown' && !event.shiftKey) {
		if (hasTriggered) {
			event.preventDefault();

			emit('down');
		}
	} else if (event.code === 'ArrowLeft' && !event.shiftKey) {
		const checkCaretPos = matchedPositions.indexOf(caretPos - 1);

		if (checkCaretPos !== -1 && checkCaretPos % 2 === 1) {
			event.preventDefault();

			position(input, matchedPositions[checkCaretPos - 1]! - 1);
		}
	} else if (event.code === 'ArrowRight' && !event.shiftKey) {
		const checkCaretPos = matchedPositions.indexOf(caretPos + 1);

		if (checkCaretPos !== -1 && checkCaretPos % 2 === 0) {
			event.preventDefault();

			position(input, matchedPositions[checkCaretPos + 1]! + 1);
		}
	} else if (event.code === 'Backspace') {
		const checkCaretPos = matchedPositions.indexOf(caretPos - 1);

		if (checkCaretPos !== -1 && checkCaretPos % 2 === 1) {
			event.preventDefault();

			const newCaretPos = matchedPositions[checkCaretPos - 1];

			parseHTML(
				(input.innerText.substring(0, newCaretPos) + input.innerText.substring(caretPos)).replaceAll(
					String.fromCharCode(160),
					' ',
				),
				true,
			);

			position(input, newCaretPos);
			emit('update:modelValue', input.innerText);
		}
	} else if (event.code === 'Delete') {
		const checkCaretPos = matchedPositions.indexOf(caretPos + 1);

		if (checkCaretPos !== -1 && checkCaretPos % 2 === 0) {
			event.preventDefault();

			parseHTML(
				(
					input.innerText.substring(0, caretPos) + input.innerText.substring(matchedPositions[checkCaretPos + 1]!)
				).replaceAll(String.fromCharCode(160), ' '),
				true,
			);

			position(input, caretPos);
			emit('update:modelValue', input.innerText);
		}
	}
}

function checkKeyUp(event: KeyboardEvent) {
	const input = event.target as HTMLEditableDivElement;

	const caretPos = window.getSelection()?.rangeCount ? position(input).pos : 0;

	if ((event.code === 'ArrowUp' || event.code === 'ArrowDown') && !event.shiftKey) {
		const checkCaretPos = matchedPositions.indexOf(caretPos);

		if (checkCaretPos !== -1 && checkCaretPos % 2 === 1) {
			position(input, matchedPositions[checkCaretPos]! + 1);
		} else if (checkCaretPos !== -1 && checkCaretPos % 2 === 0) {
			position(input, matchedPositions[checkCaretPos]! - 1);
		}
	}
}

function processText(event: Event) {
	const input = event.target as HTMLEditableDivElement;

	const caretPos = window.getSelection()?.rangeCount ? position(input).pos : 0;

	const text = input.innerText ?? '';

	let endPos = text.indexOf(' ', caretPos);
	if (endPos === -1) endPos = text.indexOf('\n', caretPos);
	if (endPos === -1) endPos = text.length;
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

function parseHTML(innerText?: string, isDirectInput = false) {
	if (!input.value) return;

	if (input.value.innerText === '\n') {
		input.value.innerText = '';
	}

	if (innerText !== undefined) {
		input.value.innerText = innerText;
		hasTriggered = false;
	}

	let newHTML = input.value.innerText;
	let caretPos = 0;

	if (isDirectInput) {
		caretPos = previousCaretPos;
	} else if (window.getSelection()?.rangeCount) {
		caretPos = position(input.value).pos;
	}

	let lastMatchIndex = 0;
	const matches = newHTML.match(new RegExp(`${props.captureGroup}(?!</mark>)`, 'gi'));
	matchedPositions = [];

	if (matches) {
		for (const match of matches ?? []) {
			let replaceSpaceBefore = '';
			let replaceSpaceAfter = '';
			let addSpaceBefore = '';
			let addSpaceAfter = '';

			const htmlMatchIndex = newHTML.indexOf(match, lastMatchIndex);
			const charCodeBefore = newHTML.charCodeAt(htmlMatchIndex - 1);
			const charCodeAfter = newHTML.charCodeAt(htmlMatchIndex + match.length);

			if (charCodeBefore === 32) {
				replaceSpaceBefore = ' ';
				addSpaceBefore = '&nbsp;';
			} else if (charCodeBefore !== 160) {
				addSpaceBefore = '&nbsp;';
			}

			if (charCodeAfter === 32) {
				replaceSpaceAfter = ' ';
				addSpaceAfter = '&nbsp;';
			} else if (charCodeAfter !== 160) {
				addSpaceAfter = '&nbsp;';
			}

			const searchString = replaceSpaceBefore + match + replaceSpaceAfter;

			const replacementString = `${addSpaceBefore}<mark class="preview" data-preview="${
				props.items[match.substring(props.triggerCharacter.length)]
			}" contenteditable="false">${match}</mark>${addSpaceAfter}`;

			newHTML = newHTML.replace(new RegExp(`(${searchString})(?!</mark>)`), replacementString);
			lastMatchIndex = htmlMatchIndex + replacementString.length - searchString.length;
		}
	}

	if (input.value.innerHTML !== newHTML.replaceAll(String.fromCharCode(160), '&nbsp;')) {
		input.value.innerHTML = newHTML;

		const delta = input.value.innerText.length - previousInnerTextLength;
		const newPosition = caretPos + delta;

		if (newPosition > input.value.innerText.length || newPosition < 0) {
			position(input.value, input.value.innerText.length);
		} else {
			position(input.value, newPosition);
		}
	}

	lastMatchIndex = 0;

	for (const match of matches ?? []) {
		const matchIndex = input.value.innerText.indexOf(match, lastMatchIndex);
		matchedPositions.push(matchIndex, matchIndex + match.length);
		lastMatchIndex = matchIndex + match.length;
	}

	previousInnerTextLength = input.value.innerText.length;
	previousCaretPos = caretPos;
}
</script>

<template>
	<div
		ref="input"
		class="v-template-input"
		:class="{ multiline }"
		contenteditable="true"
		tabindex="0"
		:placeholder="placeholder"
		@input="processText"
	/>
</template>

<style scoped lang="scss">
.v-template-input {
	position: relative;
	block-size: var(--theme--form--field--input--height);
	padding: var(--theme--form--field--input--padding);
	padding-block-end: 32px;
	overflow: hidden;
	color: var(--theme--foreground);
	font-family: var(--theme--fonts--sans--font-family);
	white-space: nowrap;
	background-color: var(--theme--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	transition: border-color var(--fast) var(--transition);

	&:empty::before {
		pointer-events: none;
		content: attr(placeholder);
		color: var(--theme--foreground-subdued);
	}

	&.multiline {
		block-size: var(--input-height-default);
		overflow-y: auto;
		white-space: pre-wrap;
	}

	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
	}

	&:focus-within {
		border-color: var(--theme--form--field--input--border-color-focus);
	}

	:deep(.preview) {
		display: inline-block;
		margin: 0;
		padding: 2px 4px;
		color: var(--theme--primary);
		font-size: 0;
		line-height: 1;
		vertical-align: -2px;
		background: var(--theme--primary-background);
		border-radius: var(--theme--border-radius);

		&::before {
			display: block;
			font-size: 1rem;
			content: attr(data-preview);
		}
	}
}
</style>
