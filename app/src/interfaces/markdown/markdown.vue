<template>
	<div class="interface-markdown" :class="view[0]">
		<div class="toolbar">
			<v-button small icon @click="edit('heading')"><v-icon name="title" /></v-button>
			<v-button small icon @click="edit('bold')"><v-icon name="format_bold" /></v-button>
			<v-button small icon @click="edit('italic')"><v-icon name="format_italic" /></v-button>
			<v-button small icon @click="edit('strikethrough')"><v-icon name="format_strikethrough" /></v-button>
			<v-button small icon @click="edit('listBulleted')"><v-icon name="format_list_bulleted" /></v-button>
			<v-button small icon @click="edit('listNumbered')"><v-icon name="format_list_numbered" /></v-button>
			<v-button small icon @click="edit('blockquote')"><v-icon name="format_quote" /></v-button>
			<v-button small icon @click="edit('code')"><v-icon name="code" /></v-button>
			<v-button small icon @click="edit('link')"><v-icon name="insert_link" /></v-button>

			<div class="spacer"></div>

			<v-button-group class="view" mandatory v-model="view" rounded>
				<v-button x-small value="editor">Editor</v-button>
				<v-button x-small value="preview">Preview</v-button>
			</v-button-group>
		</div>

		<textarea ref="codemirrorEl" :value="value || ''" />

		<div v-show="view[0] === 'preview'" class="preview-box" v-html="html"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted, watch } from '@vue/composition-api';
import { sanitize } from 'dompurify';
import marked from 'marked';

import CodeMirror from 'codemirror';
import 'codemirror/mode/markdown/markdown';

import { useEdit } from './composables/use-edit';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const codemirrorEl = ref<HTMLTextAreaElement | null>(null);
		const codemirror = ref<CodeMirror.EditorFromTextArea | null>(null);

		const view = ref(['editor']);

		onMounted(async () => {
			if (codemirrorEl.value) {
				codemirror.value = CodeMirror.fromTextArea(codemirrorEl.value, {
					mode: 'markdown',
					configureMouse: () => ({ addNew: false }),
				});

				codemirror.value.setValue(props.value || '');

				codemirror.value.on('change', (cm, { origin }) => {
					if (origin === 'setValue') return;

					const content = cm.getValue();
					emit('input', content);
				});
			}
		});

		onUnmounted(() => {
			codemirror.value?.toTextArea();
		});

		watch(
			() => props.value,
			(newValue) => {
				if (codemirror.value?.getValue() !== newValue) {
					codemirror.value?.setValue(props.value || '');
				}
			}
		);

		const { edit } = useEdit(codemirror);

		const html = computed(() => {
			const html = marked(props.value || '');
			const htmlSanitized = sanitize(html);
			return htmlSanitized;
		});

		return { codemirrorEl, edit, view, html };
	},
});
</script>

<style lang="scss" scoped>
.interface-markdown {
	--v-button-background-color: transparent;
	--v-button-color: var(--foreground-normal);
	--v-button-background-color-hover: var(--border-normal);
	--v-button-color-hover: var(--foreground-normal);

	min-height: 300px;
	overflow: hidden;
	border: 2px solid var(--border-normal);
	border-radius: var(--border-radius);
}

textarea {
	display: none;
}

.interface-markdown ::v-deep .CodeMirror {
	border: none;
	border-radius: 0;

	.CodeMirror-lines {
		padding: 0 20px;

		&:first-of-type {
			margin-top: 20px;
		}

		&:last-of-type {
			margin-bottom: 20px;
		}
	}

	.CodeMirror-scroll {
		min-height: 300px - 40px;
	}
}

.interface-markdown.preview {
	::v-deep .CodeMirror {
		display: none;
	}
}

.toolbar {
	display: flex;
	align-items: center;
	height: 40px;
	padding: 0 4px;
	background-color: var(--background-subdued);
	border-bottom: 2px solid var(--border-normal);

	.v-button + .v-button {
		margin-left: 2px;
	}

	.spacer {
		flex-grow: 1;
	}

	.view {
		--v-button-background-color: var(--border-subdued);
		--v-button-color: var(--foreground-subdued);
		--v-button-background-color-hover: var(--border-normal);
		--v-button-color-hover: var(--foreground-normal);
		--v-button-background-color-activated: var(--border-normal);
		--v-button-color-activated: var(--foreground-normal);
	}
}

.preview-box {
	padding: 20px;

	::v-deep {
		h1 {
			margin-bottom: 0;
			font-weight: 300;
			font-size: 44px;
			font-family: var(--font-serif), serif;
			line-height: 52px;
		}

		h2 {
			margin-top: 60px;
			margin-bottom: 0;
			font-weight: 600;
			font-size: 34px;
			line-height: 38px;
		}

		h3 {
			margin-top: 40px;
			margin-bottom: 0;
			font-weight: 600;
			font-size: 26px;
			line-height: 31px;
		}

		h4 {
			margin-top: 40px;
			margin-bottom: 0;
			font-weight: 600;
			font-size: 22px;
			line-height: 28px;
		}

		h5 {
			margin-top: 40px;
			margin-bottom: 0;
			font-weight: 600;
			font-size: 18px;
			line-height: 26px;
		}

		h6 {
			margin-top: 40px;
			margin-bottom: 0;
			font-weight: 600;
			font-size: 16px;
			line-height: 24px;
		}

		p {
			margin-top: 20px;
			margin-bottom: 20px;
			font-size: 16px;
			font-family: var(--font-serif), serif;
			line-height: 32px;
		}

		a {
			color: #546e7a;
		}

		ul,
		ol {
			margin: 24px 0;
			font-size: 18px;
			font-family: var(--font-serif), serif;
			line-height: 34px;
		}

		ul ul,
		ol ol,
		ul ol,
		ol ul {
			margin: 0;
		}

		b,
		strong {
			font-weight: 600;
		}

		code {
			padding: 2px 4px;
			font-size: 18px;
			font-family: var(--family-monospace), monospace;
			line-height: 34px;
			overflow-wrap: break-word;
			background-color: #eceff1;
			border-radius: 4px;
		}

		pre {
			padding: 20px;
			overflow: auto;
			font-size: 18px;
			font-family: var(--family-monospace), monospace;
			line-height: 24px;
			background-color: #eceff1;
			border-radius: 4px;
		}

		blockquote {
			margin-left: -10px;
			padding-left: 10px;
			font-size: 18px;
			font-family: var(--font-serif), serif;
			font-style: italic;
			line-height: 34px;
			border-left: 2px solid #546e7a;

			blockquote {
				margin-left: 10px;
			}
		}

		video,
		iframe,
		img {
			max-width: 100%;
			height: auto;
			border-radius: 4px;
		}

		hr {
			margin-top: 52px;
			margin-bottom: 56px;
			text-align: center;
			border: 0;
		}

		hr::after {
			font-size: 28px;
			line-height: 0;
			letter-spacing: 16px;
			content: '...';
		}

		table {
			border-collapse: collapse;
		}

		table th,
		table td {
			padding: 0.4rem;
			border: 1px solid #cfd8dc;
		}

		figure {
			display: table;
			margin: 1rem auto;
		}

		figure figcaption {
			display: block;
			margin-top: 0.25rem;
			color: #999;
			text-align: center;
		}
	}
}
</style>
