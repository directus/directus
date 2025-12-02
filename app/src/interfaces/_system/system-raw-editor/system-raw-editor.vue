<script setup lang="ts">
import { useWindowSize } from '@/composables/use-window-size';
import { getStringifiedValue } from '@/utils/get-stringified-value';
import { isValidJSON, parseJSON } from '@directus/utils';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExtension, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { computed, onMounted, onUnmounted, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { mustacheLanguage } from './mustacheMode';

const props = withDefaults(
	defineProps<{
		value?: string | object;
		autofocus?: boolean;
		disabled?: boolean;
		type?: string;
		language?: string;
		placeholder?: string;
	}>(),
	{
		value: undefined,
		autofocus: false,
		disabled: false,
		type: undefined,
		placeholder: undefined,
		language: 'mustache',
	},
);

const emit = defineEmits(['input']);

const { t } = useI18n();
const { width } = useWindowSize();

const editorEl = ref<HTMLDivElement | null>();
let editorView: EditorView | null = null;
let isUpdatingFromProps = false;

const isMultiLine = computed(() => ['text', 'json'].includes(props.type!));

const isObjectLike = computed(() => {
	if (props.type === 'json' || props.type === 'csv' || props.type?.startsWith('geometry')) return true;
	return false;
});

// Define the effect first
const setReadOnlyEffect = StateEffect.define<boolean>();

// Create a state field to track readonly state
const readOnlyField = StateField.define<boolean>({
	create: () => false,
	update: (value, tr) => {
		for (const effect of tr.effects) {
			if (effect.is(setReadOnlyEffect)) {
				return effect.value;
			}
		}

		return value;
	},
	provide: (f) => EditorView.editable.from(f, (value) => !value),
});

const readOnly = computed(() => {
	if (width.value < 600) {
		// mobile requires complete disable to avoid bringing up the keyboard
		return props.disabled;
	} else {
		return props.disabled;
	}
});

// Prevent new lines for single line fields
const singleLineKeymap = keymap.of([
	{
		key: 'Enter',
		run: () => !isMultiLine.value, // Block enter in single line mode
	},
]);

// Handle paste events for single line
const pasteHandler = EditorView.domEventHandlers({
	paste(event, view) {
		if (!isMultiLine.value) {
			event.preventDefault();
			const text = event.clipboardData?.getData('text/plain') || '';
			const singleLineText = text.replace(/\n/g, ' ');

			view.dispatch({
				changes: {
					from: view.state.selection.main.from,
					to: view.state.selection.main.to,
					insert: singleLineText,
				},
			});

			return true;
		}

		return false;
	},
});

const getLanguageExtension = () => {
	switch (props.language) {
		case 'javascript':
			return javascript();
		case 'mustache':
		default:
			return mustacheLanguage();
	}
};

onMounted(() => {
	if (!editorEl.value) return;

	const extensions = [
		// Core editor features
		history(),
		drawSelection(),
		indentOnInput(),
		bracketMatching(),
		closeBrackets(),
		syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

		// Language support
		getLanguageExtension(),

		// Custom extensions
		readOnlyField,
		singleLineKeymap,
		pasteHandler,

		// Keyboard shortcuts
		keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab] as any),

		// Update listener
		EditorView.updateListener.of((update) => {
			if (update.docChanged && !isUpdatingFromProps) {
				const content = update.state.doc.toString();

				if (content === '') {
					emit('input', null);
				} else {
					emit('input', unref(isObjectLike) && isValidJSON(content) ? parseJSON(content) : content);
				}
			}
		}),
	];

	// Add placeholder if provided
	if (props.placeholder !== undefined || props.placeholder === '') {
		extensions.push(placeholderExtension(props.placeholder || t('raw_editor_placeholder')));
	}

	const state = EditorState.create({
		doc: getStringifiedValue(props.value, unref(isObjectLike)),
		extensions,
	});

	editorView = new EditorView({
		state,
		parent: editorEl.value,
	});

	// Set initial readonly state
	if (readOnly.value) {
		editorView.dispatch({
			effects: setReadOnlyEffect.of(true),
		});
	}

	if (props.autofocus) {
		editorView.focus();
	}
});

onUnmounted(() => {
	editorView?.destroy();
});

watch(
	() => props.disabled,
	() => {
		if (editorView) {
			editorView.dispatch({
				effects: setReadOnlyEffect.of(readOnly.value),
			});
		}
	},
	{ immediate: true },
);

watch(
	() => props.value,
	(newValue) => {
		if (!editorView || isUpdatingFromProps) return;

		const currentValue = editorView.state.doc.toString();
		const newStringValue = getStringifiedValue(newValue, unref(isObjectLike));

		if (currentValue !== newStringValue) {
			isUpdatingFromProps = true;

			editorView.dispatch({
				changes: {
					from: 0,
					to: editorView.state.doc.length,
					insert: newStringValue,
				},
			});

			isUpdatingFromProps = false;
		}
	},
);
</script>

<template>
	<div class="system-raw-editor" :class="{ disabled, 'multi-line': isMultiLine }">
		<div ref="editorEl"></div>
	</div>
</template>

<style lang="scss" scoped>
.system-raw-editor {
	position: relative;
	border-radius: var(--theme--border-radius);

	:deep(.cm-editor) {
		inline-size: 100%;
		line-height: 18px;
		color: var(--theme--foreground);
		font-weight: inherit;
		font-family: var(--theme--fonts--monospace--font-family);
		background-color: var(--theme--form--field--input--background);
		border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
		border-radius: var(--theme--border-radius);
		transition: all var(--fast) var(--transition);
		box-shadow: var(--theme--form--field--input--box-shadow);
		padding: var(--theme--form--field--input--padding);

		.cm-gutters {
			display: none;
		}

		.cm-tag {
			color: var(--theme--form--field--input--foreground-subdued);
		}

		.cm-variable-2 {
			color: var(--theme--secondary);
		}
	}

	&:hover :deep(.cm-editor) {
		border-color: var(--theme--form--field--input--border-color-hover);
		box-shadow: var(--theme--form--field--input--box-shadow-hover);
	}

	&.disabled {
		:deep(.cm-editor) {
			color: var(--theme--foreground-subdued);
			background-color: var(--theme--form--field--input--background-subdued);
		}

		&:hover :deep(.cm-editor) {
			border-color: var(--theme--form--field--input--border-color);
		}
	}

	:deep(.cm-editor.cm-focused) {
		outline: none;
		border-color: var(--theme--form--field--input--border-color-focus);
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}

	:deep(.cm-scroller) {
		block-size: 100%;
		max-block-size: var(--theme--form--field--input--height);
		overflow: auto !important;
	}

	&.multi-line {
		block-size: auto;

		:deep(.cm-scroller) {
			padding-block-end: 0;
		}
	}
}
</style>
