<template>
	<v-menu attached v-model="menuActive">
		<template #activator="{ toggle }">
			<v-input :disabled="disabled">
				<template #input>
					<span ref="contentEl" class="content" contenteditable @keydown="onKeyDown" @input="onInput" @click="onClick">
						<span class="text" />
					</span>
				</template>

				<template #append>
					<v-icon name="add_box" outline @click="toggle" :disabled="disabled" />
				</template>
			</v-input>
		</template>

		<v-list v-if="!disabled">
			<field-list-item @add="addField" v-for="field in tree" :key="field.field" :field="field" :depth="depth" />
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, watch, onMounted, onUnmounted } from '@vue/composition-api';
import FieldListItem from './field-list-item.vue';
import { useFieldsStore } from '@/stores';
import { Field } from '@/types/';
import useFieldTree from '@/composables/use-field-tree';
import { FieldTree } from './types';

export default defineComponent({
	components: { FieldListItem },
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
		depth: {
			type: Number,
			default: 2,
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();
		const contentEl = ref<HTMLElement | null>(null);

		const menuActive = ref(false);

		const { collection } = toRefs(props);
		const { tree } = useFieldTree(collection);

		watch(() => props.value, setContent, { immediate: true });

		onMounted(() => {
			if (contentEl.value) {
				contentEl.value.addEventListener('selectstart', onSelect);
				setContent();
			}
		});

		onUnmounted(() => {
			if (contentEl.value) {
				contentEl.value.removeEventListener('selectstart', onSelect);
			}
		});

		return { tree, addField, onInput, contentEl, onClick, onKeyDown, menuActive, onSelect };

		function onInput() {
			if (!contentEl.value) return;

			const valueString = getInputValue();
			emit('input', valueString);
		}

		function onClick(event: MouseEvent) {
			const target = event.target as HTMLElement;

			if (target.tagName.toLowerCase() !== 'button') return;

			const field = target.dataset.field;
			emit('input', props.value.replace(`{{${field}}}`, ''));

			const before = target.previousElementSibling;
			const after = target.nextElementSibling;

			if (!before || !after || !(before instanceof HTMLElement) || !(after instanceof HTMLElement)) return;

			target.remove();
			joinElements(before, after);
			window.getSelection()?.removeAllRanges();
			onInput();
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === '{' || event.key === '}') {
				event.preventDefault();
				menuActive.value = true;
			}

			if (contentEl.value?.innerHTML === '') {
				contentEl.value.innerHTML = '<span class="text"></span>';
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
				let textSpan = null;

				for (let i = 0; i < contentEl.value.childNodes.length || !textSpan; i++) {
					const child = contentEl.value.children[i];
					if (child.classList.contains('text')) {
						textSpan = child;
					}
				}

				if (!textSpan) {
					textSpan = document.createElement('span');
					textSpan.classList.add('text');
					contentEl.value.appendChild(textSpan);
				}

				range.setStart(textSpan, 0);
				selection.addRange(range);
			}
		}

		function addField(fieldKey: string) {
			if (!contentEl.value) return;

			const field = findTree(tree.value, fieldKey.split('.'));

			if (!field) return;

			const button = document.createElement('button');
			button.dataset.field = fieldKey;
			button.setAttribute('contenteditable', 'false');
			button.innerText = String(field.name);

			if (window.getSelection()?.rangeCount == 0) {
				const range = document.createRange();
				range.selectNodeContents(contentEl.value.children[0]);
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

			const left = start.textContent?.substr(0, startOffset) || '';
			const right = start.textContent?.substr(startOffset) || '';

			start.innerText = left;

			const nextSpan = document.createElement('span');
			nextSpan.classList.add('text');
			nextSpan.innerText = right;
			contentEl.value?.insertBefore(nextSpan, start.nextSibling);
			return nextSpan;
		}

		function getInputValue() {
			if (!contentEl.value) return null;

			return Array.from(contentEl.value.childNodes).reduce((acc, node) => {
				const el = node as HTMLElement;
				const tag = el.tagName;

				if (tag) {
					if (tag.toLowerCase() === 'button') return (acc += `{{${el.dataset.field}}}`);
					if (tag.toLowerCase() === 'span') return (acc += el.textContent);
				}

				return (acc += '');
			}, '');
		}

		function setContent() {
			if (!contentEl.value) return;

			if (props.value === null || props.value === '') {
				contentEl.value.innerHTML = '<span class="text"></span>';
				return;
			}

			if (props.value !== getInputValue()) {
				const regex = /({{.*?}})/g;

				const before = null;
				const after = null;

				const newInnerHTML = props.value
					.split(regex)
					.map((part) => {
						if (part.startsWith('{{') === false) {
							return `<span class="text">${part}</span>`;
						}
						const fieldKey = part.replace(/({|})/g, '').trim();
						const field = findTree(tree.value, fieldKey.split('.'));

						if (!field) return '';

						return `<button contenteditable="false" data-field="${field.field}">${field.name}</button>`;
					})
					.join('');
				contentEl.value.innerHTML = newInnerHTML;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.content {
	display: block;
	flex-grow: 1;
	height: 100%;
	padding: var(--input-padding) 0;
	overflow: hidden;
	font-family: var(--family-monospace);
	white-space: nowrap;

	::v-deep {
		> * {
			display: inline-block;
			white-space: nowrap;
		}

		br {
			display: none;
		}

		span {
			min-width: 1px;
			min-height: 1em;
		}

		button {
			margin: 0 4px;
			padding: 0 4px;
			color: var(--primary);
			background-color: var(--primary-alt);
			border-radius: var(--border-radius);
			transition: var(--fast) var(--transition);
			transition-property: background-color, color;
			user-select: none;

			&:hover {
				color: var(--white);
				background-color: var(--danger);
			}
		}
	}
}
</style>
