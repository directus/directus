<template>
	<v-menu attached v-model="menuActive">
		<template #activator="{ toggle }">
			<v-input>
				<template #input>
					<span
						ref="contentEl"
						class="content"
						contenteditable
						@keydown="onKeyDown"
						@input="onInput"
						@click="onClick"
					/>
				</template>

				<template #append>
					<v-icon name="add_box" @click="toggle" />
				</template>
			</v-input>
		</template>

		<v-list dense>
			<field-list-item @add="addField" v-for="field in tree" :key="field.field" :field="field" />
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, watch, onMounted } from '@vue/composition-api';
import FieldListItem from './field-list-item.vue';
import { useFieldsStore } from '@/stores';
import { Field } from '@/types/';
import useFieldTree from '@/composables/use-field-tree';

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
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();
		const contentEl = ref<HTMLElement | null>(null);

		const menuActive = ref(false);

		const { collection } = toRefs(props);
		const { tree } = useFieldTree(collection);

		watch(() => props.value, setContent, { immediate: true });
		onMounted(setContent);

		return { tree, addField, onInput, contentEl, onClick, onKeyDown, menuActive };

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

			// A button is wrapped in two empty `<span></span>` elements
			target.previousElementSibling?.remove();
			target.nextElementSibling?.remove();
			target.remove();

			onInput();
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === '{' || event.key === '}') {
				event.preventDefault();
				menuActive.value = true;
			}
		}

		function addField(fieldKey: string) {
			if (!contentEl.value) return;
			const field: Field | null = fieldsStore.getField(props.collection, fieldKey);
			if (!field) return;

			const button = document.createElement('button');
			button.dataset.field = fieldKey;
			button.setAttribute('contenteditable', 'false');
			button.innerText = String(field.name);

			const range = window.getSelection()?.getRangeAt(0);
			range?.deleteContents();
			range?.insertNode(button);
			window.getSelection()?.removeAllRanges();

			onInput();
		}

		function getInputValue() {
			if (!contentEl.value) return null;

			return Array.from(contentEl.value.childNodes).reduce((acc, node) => {
				if (node.nodeType === Node.TEXT_NODE) return (acc += node.textContent);

				const el = node as HTMLElement;
				const tag = el.tagName;
				if (tag.toLowerCase() === 'button') return (acc += `{{${el.dataset.field}}}`);
				return (acc += '');
			}, '');
		}

		function setContent() {
			if (!contentEl.value) return;

			if (props.value === null) {
				contentEl.value.innerHTML = '';
				return;
			}

			if (props.value !== getInputValue()) {
				const regex = /({{.*?}})/g;

				const newInnerHTML = props.value
					.split(regex)
					.map((part) => {
						if (part.startsWith('{{') === false) return part;

						const fieldKey = part.replace(/{{/g, '').replace(/}}/g, '').trim();
						const field: Field | null = fieldsStore.getField(props.collection, fieldKey);

						// Instead of crashing when the field doesn't exist, we'll render a couple question
						// marks to indicate it's absence
						if (!field) return '???';

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
	overflow: hidden;
	font-family: var(--family-monospace);
	white-space: nowrap;

	::v-deep {
		> * {
			display: inline;
			white-space: nowrap;
		}

		br {
			display: none;
		}

		button {
			margin: 0;
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
