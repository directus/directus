<script setup lang="ts">
import { getStringifiedValue } from '@/utils/get-stringified-value';
import { EditorState, Compartment, StateEffect, StateField, Annotation } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExtension, lineNumbers, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { json } from '@codemirror/lang-json';
import { lintGutter, linter, Diagnostic } from '@codemirror/lint';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import importCodemirrorMode from './import-codemirror-mode';

const setValueAnnotation = Annotation.define<boolean>();

const INTERPOLATION_REGEX = /^\{\{\s*[^}\s]+\s*\}\}$/;

const props = withDefaults(
	defineProps<{
		value?: string | Record<string, unknown> | unknown[] | boolean | number | null;
		disabled?: boolean;
		nonEditable?: boolean;
		altOptions?: Record<string, any>;
		template?: string;
		lineNumber?: boolean;
		lineWrapping?: boolean;
		placeholder?: string;
		language?: string;
		type?: string;
	}>(),
	{
		lineNumber: true,
		language: 'plaintext',
	},
);

const emit = defineEmits(['input']);

const codemirrorEl = ref<HTMLDivElement | null>(null);
let editorView: EditorView | null = null;
let previousContent: string | null = null;
let isUpdatingFromProps = false;

const readOnly = computed(() => {
	return props.disabled;
});

const stringValue = computed(() => {
	if (props.value === null || props.value === undefined) return '';

	if (props.type === 'json' && isInterpolation(props.value)) return props.value;

	return getStringifiedValue(props.value, props.type === 'json');
});

const languageCompartment = new Compartment();
const readOnlyCompartment = new Compartment();
const lineNumbersCompartment = new Compartment();
const lineWrappingCompartment = new Compartment();
const lintCompartment = new Compartment();

const setReadOnlyEffect = StateEffect.define<boolean>();

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

async function getLanguageExtension() {
	const lang = (props.language || 'plaintext').toLowerCase();

	if (props.type === 'json' || lang === 'json') {
		return json();
	} else if (lang === 'plaintext') {
		return [];
	} else {
		const mode = await importCodemirrorMode(lang);
		return mode || [];
	}
}

async function createJsonLinter(): Promise<any> {
	if (props.type !== 'json' && props.language?.toLowerCase() !== 'json') {
		return null;
	}

	const jsonlint = (await import('jsonlint-mod')) as any;

	return linter(async (view) => {
		const text = view.state.doc.toString();
		const diagnostics: Diagnostic[] = [];

		if (isInterpolation(text)) {
			return diagnostics;
		}

		const parser = jsonlint.parser;

		parser.parseError = (str: string, hash: any) => {
			const loc = hash.loc;
			const from = view.state.doc.line(loc.first_line).from + loc.first_column;
			const to = view.state.doc.line(loc.last_line).from + loc.last_column;

			diagnostics.push({
				from,
				to,
				severity: 'error',
				message: str,
			});
		};

		if (text.length > 0) {
			try {
				jsonlint.parse(text);
			} catch {
				// Errors are captured via parseError
			}
		}

		return diagnostics;
	});
}

onMounted(async () => {
	if (!codemirrorEl.value) return;

	const languageExtension = await getLanguageExtension();
	const jsonLinter = await createJsonLinter();

	const extensions = [
		history(),
		drawSelection(),
		indentOnInput(),
		bracketMatching(),
		closeBrackets(),
		syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
		highlightSelectionMatches(),
		autocompletion(),
		keymap.of([
			...closeBracketsKeymap,
			...defaultKeymap,
			...historyKeymap,
			...searchKeymap,
			...completionKeymap,
			indentWithTab,
		] as any),

		languageCompartment.of(languageExtension),
		readOnlyCompartment.of(EditorState.readOnly.of(readOnly.value)),
		readOnlyField,
		lineNumbersCompartment.of(props.lineNumber ? lineNumbers() : []),
		lineWrappingCompartment.of(props.lineWrapping ? EditorView.lineWrapping : []),
		EditorState.tabSize.of(4),

		EditorView.updateListener.of((update) => {
			if (update.docChanged && !isUpdatingFromProps) {
				const content = update.state.doc.toString();

				if (content === previousContent) return;
				previousContent = content;

				if (update.transactions.some((tr) => tr.annotation(setValueAnnotation))) {
					return;
				}

				if (props.type === 'json') {
					if (content.length === 0) {
						return emit('input', null);
					}

					if (isInterpolation(content)) {
						return emit('input', content);
					}

					try {
						const parsedJson = JSON.parse(content);
						if (typeof parsedJson !== 'string') return emit('input', parsedJson);
						return emit('input', content);
					} catch {
						// We won't stage invalid JSON
					}
				} else {
					emit('input', content);
				}
			}
		}),
	];

	if (props.placeholder) {
		extensions.push(placeholderExtension(props.placeholder));
	}

	if (jsonLinter) {
		extensions.push(lintGutter(), lintCompartment.of(jsonLinter));
	}

	const state = EditorState.create({
		doc: String(stringValue.value),
		extensions,
	});

	editorView = new EditorView({
		state,
		parent: codemirrorEl.value,
	});
});

onUnmounted(() => {
	editorView?.destroy();
});

watch(
	() => props.language,
	async () => {
		if (!editorView) return;

		const languageExtension = await getLanguageExtension();

		editorView.dispatch({
			effects: languageCompartment.reconfigure(languageExtension),
		});
	},
);

watch(
	() => props.disabled,
	() => {
		if (!editorView) return;

		editorView.dispatch({
			effects: [
				setReadOnlyEffect.of(readOnly.value),
				readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly.value)),
			],
		});
	},
	{ immediate: true },
);

watch(
	() => props.lineNumber,
	(lineNumber) => {
		if (!editorView) return;

		editorView.dispatch({
			effects: lineNumbersCompartment.reconfigure(lineNumber ? lineNumbers() : []),
		});
	},
);

watch(
	() => props.lineWrapping,
	(lineWrapping) => {
		if (!editorView) return;

		editorView.dispatch({
			effects: lineWrappingCompartment.reconfigure(lineWrapping ? EditorView.lineWrapping : []),
		});
	},
);

watch(stringValue, () => {
	if (!editorView || isUpdatingFromProps) return;

	if (props.type === 'json' && editorView.state.doc.toString() === props.value) return;

	const currentValue = editorView.state.doc.toString();
	const newStringValue = stringValue.value;

	if (currentValue !== newStringValue) {
		isUpdatingFromProps = true;

		editorView.dispatch({
			changes: {
				from: 0,
				to: editorView.state.doc.length,
				insert: String(newStringValue || ''),
			},
			annotations: [setValueAnnotation.of(true)],
		});

		isUpdatingFromProps = false;
	}
});

function fillTemplate() {
	if (props.type === 'json' && props.template) {
		try {
			emit('input', JSON.parse(props.template));
		} finally {
			// Do nothing
		}
	} else {
		emit('input', props.template);
	}
}

function isInterpolation(value: any) {
	return typeof value === 'string' && value.match(INTERPOLATION_REGEX);
}
</script>

<template>
	<div class="input-code codemirror-custom-styles" :class="{ disabled, 'non-editable': nonEditable }" dir="ltr">
		<div ref="codemirrorEl"></div>

		<v-button v-if="template" v-tooltip.left="$t('fill_template')" small icon secondary @click="fillTemplate">
			<v-icon name="playlist_add" />
		</v-button>
	</div>
</template>

<style lang="scss" scoped>
.input-code {
	--input-code--height: var(--input-height-tall);
	--input-code--gutter--width: 50px;
	position: relative;
	inline-size: 100%;
	font-size: 14px;

	:deep(.cm-editor) {
		inline-size: 100%;
		color: var(--theme--foreground);
		font-weight: inherit;
		font-family: var(--theme--fonts--monospace--font-family);
		background-color: var(--theme--form--field--input--background);
		border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
		border-radius: var(--theme--border-radius);
		transition: all var(--fast) var(--transition);
		box-shadow: var(--theme--form--field--input--box-shadow);
		block-size: var(--input-code--height);

		.cm-gutters {
			background-color: var(--theme--form--field--input--background-subdued);
			border-inline-end: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
			inline-size: var(--input-code--gutter--width);
			border-start-start-radius: var(--theme--border-radius);
			border-end-start-radius: var(--theme--border-radius);
		}

		.cm-lineNumbers {
			color: var(--theme--foreground-subdued);
		}
	}

	&:hover :deep(.cm-editor) {
		border-color: var(--theme--form--field--input--border-color-hover);
		box-shadow: var(--theme--form--field--input--box-shadow-hover);

		.cm-gutters {
			border-inline-end-color: var(--theme--form--field--input--border-color-hover);
		}
	}

	&.disabled:not(.non-editable) {
		:deep(.cm-editor) {
			color: var(--theme--foreground-subdued);
			background-color: var(--theme--form--field--input--background-subdued);
		}
	}

	&.disabled {
		&:hover :deep(.cm-editor) {
			border-color: var(--theme--form--field--input--border-color);
		}
	}

	:deep(.cm-editor.cm-focused) {
		outline: none;
		border-color: var(--theme--form--field--input--border-color-focus);
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}

.small {
	position: absolute;
	inset-inline-end: 0;
	inset-block-end: -20px;
	font-style: italic;
	text-align: end;
}

.v-button {
	position: absolute;
	inset-block-start: 10px;
	inset-inline-end: 10px;
	z-index: 4;
	color: var(--theme--primary);
	cursor: pointer;
	transition: color var(--fast) var(--transition-out);

	&:hover {
		color: var(--theme--primary-accent);
		transition: none;
	}
}
</style>
