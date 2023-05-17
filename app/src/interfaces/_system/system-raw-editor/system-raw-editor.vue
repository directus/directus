<template>
	<div class="system-raw-editor" :class="{ disabled, 'multi-line': isMultiLine }">
		<div ref="codemirrorEl"></div>
	</div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@/composables/use-window-size';
import { parseJSON } from '@directus/utils';
import CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import { computed, onMounted, ref, watch } from 'vue';
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
	}
);

const emit = defineEmits(['input']);

const { t } = useI18n();

const { width } = useWindowSize();

const codemirrorEl = ref<HTMLTextAreaElement | null>();
let codemirror: CodeMirror.Editor | null;
let previousContent: string | null = null;

const isMultiLine = computed(() => ['text', 'json'].includes(props.type!));

onMounted(async () => {
	if (codemirrorEl.value) {
		CodeMirror.defineSimpleMode('mustache', mustacheMode);

		codemirror = CodeMirror(codemirrorEl.value, {
			mode: props.language,
			value: typeof props.value === 'object' ? JSON.stringify(props.value, null, 4) : String(props.value ?? ''),
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

			if (typeof props.value === 'object') {
				try {
					emit('input', content !== '' ? parseJSON(content) : null);
				} catch {
					// Skip emitting invalid JSON
				}
			} else {
				emit('input', content !== '' ? content : null);
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
	{ immediate: true }
);
</script>

<style lang="scss" scoped>
.system-raw-editor {
	position: relative;
	height: var(--input-height);
	min-height: var(--input-height);
	border-radius: var(--border-radius);

	:deep(.CodeMirror) {
		width: 100%;
		line-height: 18px;
		padding: var(--input-padding);

		.cm-tag {
			color: var(--foreground-subdued);
		}

		.cm-variable-2 {
			color: var(--secondary);
		}
	}

	:deep(.CodeMirror),
	:deep(.CodeMirror-scroll) {
		max-height: var(--input-height);
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
