<template>
	<div class="input-code codemirror-custom-styles" :class="{ disabled }">
		<div ref="codemirrorEl"></div>

		<v-button v-if="template" v-tooltip.left="t('fill_template')" small icon secondary @click="fillTemplate">
			<v-icon name="playlist_add" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import CodeMirror, { ModeSpec } from 'codemirror';

import { defineComponent, computed, ref, onMounted, watch, PropType } from 'vue';

import 'codemirror/mode/meta';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/addon/search/matchesonscrollbar.js';
import 'codemirror/addon/scroll/annotatescrollbar.js';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/search/search.js';
import 'codemirror/addon/display/placeholder.js';

import 'codemirror/addon/comment/comment.js';
import 'codemirror/addon/dialog/dialog.js';
import 'codemirror/keymap/sublime.js';

import formatTitle from '@directus/format-title';
import importCodemirrorMode from './import-codemirror-mode';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: [String, Object, Array] as PropType<string | Record<string, any> | any[]>,
			default: null,
		},
		altOptions: {
			type: Object,
			default: null,
		},
		template: {
			type: String,
			default: null,
		},
		lineNumber: {
			type: Boolean,
			default: true,
		},
		lineWrapping: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		language: {
			type: String,
			default: 'plaintext',
		},
		type: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const codemirrorEl = ref<HTMLTextAreaElement | null>(null);
		let codemirror: CodeMirror.Editor | null;

		onMounted(async () => {
			if (codemirrorEl.value) {
				await getImports(cmOptions.value);

				await importCodemirrorMode(cmOptions.value.mode);

				codemirror = CodeMirror(codemirrorEl.value, {
					...cmOptions.value,
					value: stringValue.value,
				});

				codemirror.setOption('mode', { name: 'javascript ' });

				await setLanguage();

				codemirror.on('change', (cm, { origin }) => {
					if (origin === 'setValue') return;

					const content = cm.getValue();

					if (props.type === 'json') {
						if (content.length === 0) {
							return emit('input', null);
						}

						try {
							emit('input', JSON.parse(content));
						} catch {
							// We won't stage invalid JSON
						}
					} else {
						emit('input', content);
					}
				});
			}
		});

		const stringValue = computed<string>(() => {
			if (props.value === null) return '';

			if (typeof props.value === 'object') {
				return JSON.stringify(props.value, null, 4);
			}

			return props.value as string;
		});

		watch(
			() => props.language,
			() => {
				setLanguage();
			}
		);

		watch(stringValue, () => {
			if (codemirror?.getValue() !== stringValue.value) {
				codemirror?.setValue(stringValue.value || '');
			}
		});

		async function setLanguage() {
			if (codemirror) {
				const lang = props.language.toLowerCase();

				if (props.type === 'json' || lang === 'json') {
					// @ts-ignore
					await import('codemirror/mode/javascript/javascript.js');

					const jsonlint = (await import('jsonlint-mod')) as any;

					codemirror.setOption('mode', { name: 'javascript', json: true } as ModeSpec<{ json: boolean }>);

					CodeMirror.registerHelper('lint', 'json', (text: string) => {
						const found: Record<string, any>[] = [];
						const parser = jsonlint.parser;

						parser.parseError = (str: string, hash: any) => {
							const loc = hash.loc;
							found.push({
								from: CodeMirror.Pos(loc.first_line - 1, loc.first_column),
								to: CodeMirror.Pos(loc.last_line - 1, loc.last_column),
								message: str,
							});
						};

						if (text.length > 0) {
							try {
								jsonlint.parse(text);
							} catch {
								// Do nothing
							}
						}
						return found;
					});
				} else if (lang === 'plaintext') {
					codemirror.setOption('mode', { name: 'plaintext' });
				} else {
					await importCodemirrorMode(lang);
					codemirror.setOption('mode', { name: lang });
				}
			}
		}

		async function getImports(optionsObj: Record<string, any>): Promise<void> {
			const imports = [] as Promise<any>[];

			if (optionsObj && optionsObj.size > 0) {
				if (optionsObj.styleActiveLine) {
					imports.push(import('codemirror/addon/selection/active-line.js'));
				}

				if (optionsObj.markSelection) {
					// @ts-ignore - @types/codemirror is missing this export
					imports.push(import('codemirror/addon/selection/mark-selection.js'));
				}
				if (optionsObj.highlightSelectionMatches) {
					imports.push(import('codemirror/addon/search/match-highlighter.js'));
				}
				if (optionsObj.autoRefresh) {
					imports.push(import('codemirror/addon/display/autorefresh.js'));
				}
				if (optionsObj.matchBrackets) {
					imports.push(import('codemirror/addon/edit/matchbrackets.js'));
				}
				if (optionsObj.hintOptions || optionsObj.showHint) {
					imports.push(import('codemirror/addon/hint/show-hint.js'));
					// @ts-ignore - @types/codemirror is missing this export
					imports.push(import('codemirror/addon/hint/show-hint.css'));
					// @ts-ignore - @types/codemirror is missing this export
					imports.push(import('codemirror/addon/hint/javascript-hint.js'));
				}
				await Promise.all(imports);
			}
		}

		const lineCount = computed(() => {
			if (codemirror) {
				return codemirror.lineCount();
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
			lint: true,
			gutters: ['CodeMirror-lint-markers'],
		};

		const cmOptions = computed<Record<string, any>>(() => {
			return Object.assign(
				{},
				defaultOptions,
				{
					lineNumbers: props.lineNumber,
					lineWrapping: props.lineWrapping,
					readOnly: props.disabled ? 'nocursor' : false,
					mode: props.language,
					placeholder: props.placeholder,
				},
				props.altOptions ? props.altOptions : {}
			);
		});

		watch(
			() => props.disabled,
			(disabled) => {
				codemirror?.setOption('readOnly', disabled ? 'nocursor' : false);
			},
			{ immediate: true }
		);

		watch(
			() => props.altOptions,
			async (altOptions) => {
				if (!altOptions || altOptions.size === 0) return;
				await getImports(altOptions);
				for (const key in altOptions) {
					codemirror?.setOption(key as any, altOptions[key]);
				}
			}
		);

		watch(
			() => props.lineNumber,
			(lineNumber) => {
				codemirror?.setOption('lineNumbers', lineNumber);
			}
		);

		return { t, cmOptions, lineCount, codemirrorEl, stringValue, fillTemplate, formatTitle };

		function fillTemplate() {
			if (props.type === 'json') {
				try {
					emit('input', JSON.parse(props.template));
				} finally {
					// Do nothing
				}
			} else {
				emit('input', props.template);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.input-code {
	position: relative;
	width: 100%;
	font-size: 14px;
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
	z-index: 4;
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
