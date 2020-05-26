<template>
	<div class="interface-code codemirror-custom-styles">
		<textarea ref="codemirrorEl" :value="stringValue" />

		<v-button
			v-if="template"
			v-tooltip="$t('interfaces.code.fill_template')"
			@click="fillTemplate"
		>
			<v-icon name="playlist_add" />
		</v-button>

		<small v-if="language" class="line-count type-note">
			{{
				$tc('loc', lineCount, {
					count: lineCount,
					lang: formatTitle(language),
				})
			}}
		</small>
	</div>
</template>

<script lang="ts">
import CodeMirror from 'codemirror';

import {
	defineComponent,
	computed,
	ref,
	onMounted,
	onUnmounted,
	watch,
} from '@vue/composition-api';

import 'codemirror/mode/meta';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/addon/search/matchesonscrollbar.js';
import 'codemirror/addon/scroll/annotatescrollbar.js';
import 'codemirror/addon/search/search.js';

import 'codemirror/addon/comment/comment.js';
import 'codemirror/addon/dialog/dialog.js';
import 'codemirror/keymap/sublime.js';

import formatTitle from '@directus/format-title';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
		},
		altOptions: {
			type: Object,
			default: null,
		},
		template: {
			type: [Object, Array],
			default: null,
		},
		lineNumber: {
			type: Boolean,
			default: null,
		},
		language: {
			type: String,
			default: 'javascript',
		},
	},
	setup(props, { emit }) {
		const codemirrorEl = ref<HTMLTextAreaElement>(null);
		const codemirror = ref<CodeMirror.EditorFromTextArea>(null);

		onMounted(async () => {
			if (codemirrorEl.value) {
				const codemirrorElVal = codemirrorEl.value;

				await getImports(cmOptions.value);
				codemirror.value = CodeMirror.fromTextArea(codemirrorElVal, cmOptions.value);
				codemirror.value.setValue(stringValue.value || props.template);
				await setLanguage();
				codemirror.value.on('change', (cm) => {
					const content = cm.getValue();
					emit('input', content);
				});
			}
		});

		onUnmounted(() => {
			codemirror.value?.toTextArea();
		});

		const stringValue = computed<string>(() => {
			if (props.value == null) return '';

			if (typeof props.value === 'object') {
				return JSON.stringify(props.value, null, 4);
			}

			return props.value;
		});

		watch(
			() => props.language,
			() => {
				setLanguage();
			}
		);

		async function setLanguage() {
			if (codemirror.value) {
				await import(`codemirror/mode/${props.language}/${props.language}.js`);
				codemirror.value.setOption('mode', props.language);
			}
		}

		async function getImports(optionsObj: Record<string, any>): Promise<void> {
			const imports = [] as Promise<any>[];

			if (optionsObj && optionsObj.size > 0) {
				if (optionsObj.styleActiveLine) {
					imports.push(import(`codemirror/addon/selection/active-line.js`));
				}

				if (optionsObj.markSelection) {
					// @ts-ignore - @types/codemirror is missing this export
					imports.push(import(`codemirror/addon/selection/mark-selection.js`));
				}
				if (optionsObj.highlightSelectionMatches) {
					imports.push(import(`codemirror/addon/search/match-highlighter.js`));
				}
				if (optionsObj.autoRefresh) {
					imports.push(import(`codemirror/addon/display/autorefresh.js`));
				}
				if (optionsObj.matchBrackets) {
					imports.push(import(`codemirror/addon/edit/matchbrackets.js`));
				}
				if (optionsObj.hintOptions || optionsObj.showHint) {
					imports.push(import(`codemirror/addon/hint/show-hint.js`));
					// @ts-ignore - @types/codemirror is missing this export
					imports.push(import(`codemirror/addon/hint/show-hint.css`));
					// @ts-ignore - @types/codemirror is missing this export
					imports.push(import(`codemirror/addon/hint/javascript-hint.js`));
				}
				await Promise.all(imports);
			}
		}

		const lineCount = computed(() => {
			if (codemirror.value) {
				return codemirror.value.lineCount();
			}
			return 0;
		});

		const defaultOptions: CodeMirror.EditorConfiguration = {
			tabSize: 4,
			autoRefresh: true,
			indentUnit: 4,
			styleActiveLine: true,
			highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true, delay: 100 },
			hintOptions: {
				completeSingle: true,
				hint: () => undefined,
			},
			matchBrackets: true,
			showCursorWhenSelecting: true,
			theme: 'default',
			extraKeys: { Ctrl: 'autocomplete' },
		};

		const cmOptions = computed<Record<string, any>>(() => {
			return Object.assign(
				{},
				defaultOptions,
				{
					lineNumbers: props.lineNumber,
					readOnly: props.disabled ? 'nocursor' : false,
					mode: props.language,
				},
				props.altOptions ? props.altOptions : {}
			);
		});

		watch(
			() => props.altOptions,
			async (altOptions) => {
				if (!altOptions || altOptions.size === 0) return;
				await getImports(altOptions);
				for (const key in altOptions) {
					codemirror.value?.setOption(key as any, altOptions[key]);
				}
			}
		);

		watch(
			() => props.lineNumber,
			(lineNumber) => {
				codemirror.value?.setOption('lineNumbers', lineNumber);
			}
		);

		return {
			cmOptions,
			lineCount,
			codemirrorEl,
			stringValue,
			fillTemplate,
			formatTitle,
		};

		function fillTemplate() {
			if (props.template instanceof Object || props.template instanceof Array) {
				return emit('input', JSON.stringify(props.template, null, 4));
			}

			try {
				emit('input', JSON.parse(props.template));
			} catch (e) {
				emit('input', props.template);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.interface-code {
	position: relative;
	width: 100%;
	max-width: 620px;
	font-size: 12px;
	&:focus {
		border-color: var(--primary-125);
	}
}

.small {
	position: absolute;
	right: 0;
	bottom: -20px;
	font-style: italic;
	text-align: right;
}

.v-button {
	position: absolute;
	top: 10px;
	right: 10px;
	z-index: 10;
	color: var(--primary);
	cursor: pointer;
	transition: color var(--fast) var(--transition-out);
	user-select: none;
	&:hover {
		color: var(--primary-125);
		transition: none;
	}
}
</style>
