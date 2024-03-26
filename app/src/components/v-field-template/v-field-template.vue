<script setup lang="ts">
import type { FieldNode } from '@/composables/use-field-tree';
import { flattenFieldGroups } from '@/utils/flatten-field-groups';
import { useEventListener } from '@vueuse/core';
import { Ref, computed, onMounted, ref, watch } from 'vue';
import FieldListItem from './field-list-item.vue';
import { FieldTree } from './types';

const props = withDefaults(
	defineProps<{
		tree: FieldNode[];
		modelValue?: string | null;
		disabled?: boolean;
		nullable?: boolean;
		loadPathLevel?: (fieldPath: string, root?: FieldNode | undefined) => void;
		depth?: number;
		placeholder?: string;
	}>(),
	{
		modelValue: null,
		nullable: true,
		collection: null,
		depth: undefined,
		inject: null,
	},
);

const emit = defineEmits(['update:modelValue']);

const contentEl: Ref<HTMLSpanElement | null> = ref(null);
const menuActive = ref(false);

watch(() => props.modelValue, setContent);

onMounted(setContent);

useEventListener(contentEl, 'selectstart', onSelect);

const grouplessTree = computed(() => {
	return flattenFieldGroups(props.tree);
});

function onInput() {
	if (!contentEl.value) return;

	const valueString = getInputValue();
	emit('update:modelValue', valueString);
}

function onClick(event: MouseEvent) {
	const target = event.target as HTMLSpanElement;

	if (target.tagName.toLowerCase() !== 'button') return;

	const field = target.dataset.field;
	emit('update:modelValue', props.modelValue?.replace(`{{${field}}}`, ''));

	const before = target.previousElementSibling;
	const after = target.nextElementSibling;

	if (!(before instanceof HTMLElement) || !(after instanceof HTMLElement)) return;

	target.remove();
	joinElements(before, after);
	window.getSelection()?.removeAllRanges();
	onInput();
}

function onKeyDown(event: KeyboardEvent) {
	if (event.key === 'Enter') {
		event.preventDefault();
	}

	if (event.key === '{' || event.key === '}') {
		event.preventDefault();
		menuActive.value = true;
	}

	if (contentEl.value?.innerHTML === '') {
		contentEl.value.innerHTML = '<span class="text" />';
	}
}

function onSelect() {
	if (!contentEl.value) return;

	const selection = window.getSelection();
	if (!selection || selection.rangeCount <= 0) return;

	const range = selection.getRangeAt(0);
	if (!range) return;

	const start = range.startContainer;

	if (
		!(start instanceof HTMLElement && start.classList.contains('text')) &&
		!start.parentElement?.classList.contains('text')
	) {
		selection.removeAllRanges();
		const range = new Range();
		let textSpan = Array.from(contentEl.value.querySelectorAll('span.text')).at(-1);

		if (!textSpan) {
			textSpan = document.createElement('span');
			textSpan.classList.add('text');
			contentEl.value.appendChild(textSpan);
		}

		range.setStart(textSpan, 0);
		selection.addRange(range);
	}
}

function addField(field: FieldTree) {
	if (!contentEl.value) return;

	const button = document.createElement('button');
	button.dataset.field = field.key;
	button.setAttribute('contenteditable', 'false');
	button.innerText = String(field.name);

	if (window.getSelection()?.rangeCount == 0) {
		const firstChild = contentEl.value.children[0];
		if (!firstChild) return;

		const range = document.createRange();
		range.selectNodeContents(firstChild);
		window.getSelection()?.addRange(range);
	}

	const range = window.getSelection()?.getRangeAt(0);
	if (!range) return;

	range.deleteContents();

	const end = splitElements();

	if (end) {
		contentEl.value.insertBefore(button, end);
		window.getSelection()?.removeAllRanges();
	} else {
		contentEl.value.appendChild(button);
		const span = document.createElement('span');
		span.classList.add('text');
		contentEl.value.appendChild(span);
	}

	onInput();
}

function findTree(tree: FieldTree[] | undefined, fieldSections: string[]): FieldTree | undefined {
	if (tree === undefined) return undefined;

	const fieldObject = tree.find((f) => f.field === fieldSections[0]);

	if (fieldObject === undefined) return undefined;
	if (fieldSections.length === 1) return fieldObject;
	return findTree(fieldObject.children, fieldSections.slice(1));
}

function joinElements(first: HTMLElement, second: HTMLElement) {
	first.innerText += second.innerText;
	second.remove();
}

function splitElements() {
	const range = window.getSelection()?.getRangeAt(0);
	if (!range) return;

	const textNode = range.startContainer;
	if (textNode.nodeType !== Node.TEXT_NODE) return;
	const start = textNode.parentElement;
	if (!start || !(start instanceof HTMLSpanElement) || !start.classList.contains('text')) return;

	const startOffset = range.startOffset;

	const left = start.textContent?.slice(0, startOffset) || '';
	const right = start.textContent?.slice(startOffset) || '';

	start.innerText = left;

	const nextSpan = document.createElement('span');
	nextSpan.classList.add('text');
	nextSpan.innerText = right;
	contentEl.value?.insertBefore(nextSpan, start.nextSibling);
	return nextSpan;
}

function getInputValue() {
	if (!contentEl.value) return null;

	const value = Array.from(contentEl.value.childNodes).reduce((acc, node) => {
		if (node instanceof HTMLButtonElement) return (acc += `{{${node.dataset.field}}}`);
		else if ('textContent' in node) return (acc += node.textContent);
		return acc;
	}, '');

	if (props.nullable === true && value === '') {
		return null;
	}

	return value;
}

function setContent() {
	if (!contentEl.value) return;

	if (props.modelValue === null || props.modelValue === '') {
		contentEl.value.innerHTML = '<span class="text" />';
		return;
	}

	if (props.modelValue !== getInputValue()) {
		const regex = /({{.*?}})/g;

		const newInnerHTML = props.modelValue
			.split(regex)
			.map((part) => {
				if (part.startsWith('{{') === false) {
					return `<span class="text">${part}</span>`;
				}

				const fieldKey = part.replace(/({|})/g, '').trim();
				const fieldPath = fieldKey.split('.');

				for (let i = 0; i < fieldPath.length; i++) {
					props.loadPathLevel?.(fieldPath.slice(0, i).join('.'));
				}

				const field = findTree(grouplessTree.value, fieldPath);

				if (!field) return '';

				return `<button contenteditable="false" data-field="${fieldKey}" ${props.disabled ? 'disabled' : ''}>${
					field.name
				}</button>`;
			})
			.join('');

		contentEl.value.innerHTML = newInnerHTML;
	}
}
</script>

<template>
	<v-menu v-model="menuActive" attached>
		<template #activator="{ toggle }">
			<v-input :disabled="disabled">
				<template #input>
					<span
						ref="contentEl"
						class="content"
						:contenteditable="!disabled"
						:placeholder="!modelValue ? placeholder : undefined"
						spellcheck="false"
						@keydown="onKeyDown"
						@input="onInput"
						@click="onClick"
					>
						<span class="text" />
					</span>
				</template>

				<template #append>
					<v-icon name="add_box" outline clickable :disabled="disabled" @click="toggle" />
				</template>
			</v-input>
		</template>

		<v-list v-if="!disabled" :mandatory="false" @toggle="loadPathLevel?.($event.value)">
			<field-list-item v-for="field in tree" :key="field.field" :field="field" :depth="depth" @add="addField" />
		</v-list>
	</v-menu>
</template>

<style scoped lang="scss">
.content {
	display: block;
	flex-grow: 1;
	height: 100%;
	padding: var(--theme--form--field--input--padding) 0;
	overflow: hidden;
	font-size: 14px;
	font-family: var(--theme--fonts--monospace--font-family);
	white-space: pre;

	> :deep(*) {
		display: inline-block;
		white-space: nowrap;
	}

	> :deep(span.text) {
		white-space: pre;

		&:empty::before {
			content: '\200b';
		}
	}

	&[placeholder]:after {
		content: attr(placeholder);
		color: var(--theme--foreground-subdued);
		pointer-events: none;
	}

	:deep(button) {
		margin: -1px 4px;
		padding: 1px 4px;
		color: var(--theme--primary);
		background-color: var(--theme--primary-background);
		border-radius: var(--theme--border-radius);
		transition: var(--fast) var(--transition);
		transition-property: background-color, color;
		user-select: none;
	}

	:deep(button:not(:disabled):hover) {
		color: var(--white);
		background-color: var(--theme--danger);
	}
}
</style>
