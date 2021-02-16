<template>
	<div class="interface-code codemirror-custom-styles" :class="{ disabled }">
		<textarea ref="codemirrorEl" :value="stringValue" />

		<v-button small icon secondary v-if="template" v-tooltip.left="$t('fill_template')" @click="fillTemplate">
			<v-icon name="playlist_add" />
		</v-button>
	</div>
</template>

<script lang="ts">
import CodeMirror from 'codemirror';

import { defineComponent, computed, ref, onMounted, onUnmounted, watch } from '@vue/composition-api';

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

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: [String, Object, Array],
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
	setup(props, { emit }) {
		const codemirrorEl = ref<HTMLTextAreaElement | null>(null);
		const codemirror = ref<CodeMirror.EditorFromTextArea | null>(null);

		onMounted(async () => {
			if (codemirrorEl.value) {
				const codemirrorElVal = codemirrorEl.value;

				await getImports(cmOptions.value);
				codemirror.value = CodeMirror.fromTextArea(codemirrorElVal, cmOptions.value);
				codemirror.value.setValue(stringValue.value || '');
				await setLanguage();
				codemirror.value.on('change', (cm, { origin }) => {
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

		onUnmounted(() => {
			codemirror.value?.toTextArea();
		});

		const stringValue = computed<string>(() => {
			if (props.value == null) return '';

			if (props.type === 'json') {
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

		watch(stringValue, () => {
			if (codemirror.value?.getValue() !== stringValue.value) {
				codemirror.value?.setValue(stringValue.value || '');
			}
		});

		async function setLanguage() {
			if (codemirror.value) {
				const lang = props.language.toLowerCase();

				if (lang === 'json') {
					// @ts-ignore
					await import('codemirror/mode/javascript/javascript.js');

					const jsonlint = (await import('jsonlint-mod')) as any;

					codemirror.value.setOption('mode', { name: 'javascript', json: true });

					CodeMirror.registerHelper('lint', 'json', (text: string) => {
						const found: {}[] = [];
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
							} catch (e) {}
						}
						return found;
					});
				} else if (lang === 'plaintext') {
					codemirror.value.setOption('mode', { name: null });
				} else {
					await import(`codemirror/mode/${lang}/${lang}.js`);
					codemirror.value.setOption('mode', { name: lang });
				}
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
			lint: true,
			gutters: ['CodeMirror-lint-markers'],
		};

		const cmOptions = computed<Record<string, any>>(() => {
			return Object.assign(
				{},
				defaultOptions,
				{
					lineNumbers: props.lineNumber,
					readOnly: false,
					mode: props.language,
					placeholder: props.placeholder,
				},
				props.altOptions ? props.altOptions : {}
			);
		});

		watch(
			() => props.disabled,
			(disabled) => {
				codemirror.value?.setOption('readOnly', disabled ? 'nocursor' : false);
			},
			{ immediate: true }
		);

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
			if (props.type === 'json') {
				try {
					emit('input', JSON.parse(props.template));
				} catch {}
			} else {
				emit('input', props.template);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '~codemirror/addon/lint/lint.css';

.interface-code {
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
