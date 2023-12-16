<script setup lang="ts">
import { useWindowSize } from '@/composables/use-window-size';
import { getStringifiedValue } from '@/utils/get-stringified-value';
import { isValidJSON, parseJSON } from '@directus/utils';
import CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import { computed, onMounted, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { mustacheMode } from './mustacheMode';

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

const codemirrorEl = ref<HTMLTextAreaElement | null>();
let codemirror: CodeMirror.Editor | null;
let previousContent: string | null = null;

const isMultiLine = computed(() => ['text', 'json'].includes(props.type!));

const isObjectLike = computed(() => {
	if (props.type === 'json' || props.type === 'csv' || props.type?.startsWith('geometry')) return true;
	return false;
});

onMounted(async () => {
	if (codemirrorEl.value) {
		CodeMirror.defineSimpleMode('mustache', mustacheMode);

		codemirror = CodeMirror(codemirrorEl.value, {
			mode: props.language,
			value: getStringifiedValue(props.value, unref(isObjectLike)),
			tabSize: 0,
			autoRefresh: true,
			indentUnit: 4,
			styleActiveLine: true,
			highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true, delay: 100 },
			matchBrackets: true,
			showCursorWhenSelecting: true,
			lineWiseCopyCut: false,
			theme: 'default',
			scrollbarStyle: isMultiLine.value ? 'native' : 'null',
			extraKeys: { Ctrl: 'autocomplete' },
			cursorBlinkRate: props.disabled ? -1 : 530,
			placeholder: props.placeholder !== undefined ? props.placeholder : t('raw_editor_placeholder'),
			readOnly: readOnly.value,
		});

		// prevent new lines for single lines
		if (!isMultiLine.value) {
			codemirror.on('beforeChange', function (_doc, { origin, text, cancel, update }) {
				const typedNewLine = origin === '+input' && typeof text === 'object' && text.join('') === '';
				if (typedNewLine) return cancel();

				const pastedNewLine = origin === 'paste' && typeof text === 'object' && text.length > 1;

				if (pastedNewLine) {
					const newText = text.join(' ');
					if (!update) return;
					return update(undefined, undefined, [newText]);
				}

				return null;
			});
		}

		codemirror.on('change', (doc, { origin }) => {
			const content = doc.getValue();

			// prevent duplicate emits with same content
			if (content === previousContent) return;
			previousContent = content;

			if (origin === 'setValue') return;

			if (content === '') {
				emit('input', null);
			} else {
				emit('input', unref(isObjectLike) && isValidJSON(content) ? parseJSON(content) : content);
			}
		});
	}
});

const readOnly = computed(() => {
	if (width.value < 600) {
		// mobile requires 'nocursor' to avoid bringing up the keyboard
		return props.disabled ? 'nocursor' : false;
	} else {
		// desktop cannot use 'nocursor' as it prevents copy/paste
		return props.disabled;
	}
});

watch(
	() => props.disabled,
	(disabled) => {
		codemirror?.setOption('readOnly', readOnly.value);
		codemirror?.setOption('cursorBlinkRate', disabled ? -1 : 530);
	},
	{ immediate: true },
);

watch(
	() => props.value,
	(newValue) => {
		const currentValue = codemirror?.getValue();

		if (currentValue !== newValue) {
			codemirror?.setValue(getStringifiedValue(newValue, unref(isObjectLike)));
		}
	},
);
</script>

<template>
	<div class="system-raw-editor" :class="{ disabled, 'multi-line': isMultiLine }">
		<div ref="codemirrorEl"></div>
	</div>
</template>

<style lang="scss" scoped>
.system-raw-editor {
	position: relative;
	height: var(--theme--form--field--input--height);
	min-height: var(--theme--form--field--input--height);
	border-radius: var(--theme--border-radius);

	:deep(.CodeMirror) {
		width: 100%;
		line-height: 18px;
		padding: var(--theme--form--field--input--padding);

		.cm-tag {
			color: var(--theme--form--field--input--foreground-subdued);
		}

		.cm-variable-2 {
			color: var(--theme--secondary);
		}
	}

	:deep(.CodeMirror),
	:deep(.CodeMirror-scroll) {
		max-height: var(--theme--form--field--input--height);
	}

	&.multi-line {
		height: auto;

		:deep(.CodeMirror),
		:deep(.CodeMirror-scroll) {
			max-height: 480px;
		}

		:deep(.CodeMirror-scroll) {
			padding-bottom: 0;
		}
	}
}
</style>
