<template>
	<div class="interface-markdown" :class="view[0]" ref="markdownInterface">
		<div class="toolbar">
			<v-menu show-arrow placement="bottom-start">
				<template #activator="{ toggle }">
					<v-button small icon @click="toggle" v-tooltip="$t('wysiwyg_options.heading')">
						<v-icon name="title" />
					</v-button>
				</template>
				<v-list>
					<v-list-item v-for="n in 6" :key="n" @click="edit('heading', { level: n })">
						<v-list-item-content><v-text-overflow :text="$t(`wysiwyg_options.h${n}`)" /></v-list-item-content>
						<v-list-item-hint>{{ translateShortcut(['meta', 'alt']) }} {{ n }}</v-list-item-hint>
					</v-list-item>
				</v-list>
			</v-menu>

			<v-button
				small
				icon
				@click="edit('bold')"
				v-tooltip="$t('wysiwyg_options.bold') + ' - ' + translateShortcut(['meta', 'b'])"
			>
				<v-icon name="format_bold" />
			</v-button>
			<v-button
				small
				icon
				@click="edit('italic')"
				v-tooltip="$t('wysiwyg_options.italic') + ' - ' + translateShortcut(['meta', 'i'])"
			>
				<v-icon name="format_italic" />
			</v-button>
			<v-button
				small
				icon
				@click="edit('strikethrough')"
				v-tooltip="$t('wysiwyg_options.strikethrough') + ' - ' + translateShortcut(['meta', 'alt', 'd'])"
			>
				<v-icon name="format_strikethrough" />
			</v-button>
			<v-button small icon @click="edit('listBulleted')" v-tooltip="$t('wysiwyg_options.bullist')">
				<v-icon name="format_list_bulleted" />
			</v-button>
			<v-button small icon @click="edit('listNumbered')" v-tooltip="$t('wysiwyg_options.numlist')">
				<v-icon name="format_list_numbered" />
			</v-button>
			<v-button
				small
				icon
				@click="edit('blockquote')"
				v-tooltip="$t('wysiwyg_options.blockquote') + ' - ' + translateShortcut(['meta', 'alt', 'q'])"
			>
				<v-icon name="format_quote" />
			</v-button>
			<v-button
				small
				icon
				@click="edit('code')"
				v-tooltip="$t('wysiwyg_options.codeblock') + ' - ' + translateShortcut(['meta', 'alt', 'c'])"
			>
				<v-icon name="code" />
			</v-button>
			<v-button
				small
				icon
				@click="edit('link')"
				v-tooltip="$t('wysiwyg_options.link') + ' - ' + translateShortcut(['meta', 'k'])"
			>
				<v-icon name="insert_link" />
			</v-button>

			<v-menu show-arrow :close-on-content-click="false">
				<template #activator="{ toggle }">
					<v-button small icon @click="toggle" v-tooltip="$t('wysiwyg_options.table')">
						<v-icon name="table_chart" />
					</v-button>
				</template>

				<template #default="{ deactivate }">
					<div class="table-options">
						<div class="field half">
							<p class="type-label">{{ $t('rows') }}</p>
							<v-input :min="1" type="number" v-model="table.rows" />
						</div>
						<div class="field half">
							<p class="type-label">{{ $t('columns') }}</p>
							<v-input :min="1" type="number" v-model="table.columns" />
						</div>
						<div class="field full">
							<v-button
								full-width
								@click="
									() => {
										edit('table', table);
										deactivate();
									}
								"
							>
								Create
							</v-button>
						</div>
					</div>
				</template>
			</v-menu>

			<v-button @click="imageDialogOpen = true" small icon v-tooltip="$t('wysiwyg_options.image')">
				<v-icon name="insert_photo" />
			</v-button>

			<v-button
				v-for="custom in customSyntax"
				small
				icon
				:key="custom.name"
				@click="edit('custom', custom)"
				v-tooltip="custom.name"
			>
				<v-icon :name="custom.icon" />
			</v-button>

			<div class="spacer"></div>

			<v-button-group class="view" mandatory v-model="view" rounded>
				<v-button x-small value="editor">Editor</v-button>
				<v-button x-small value="preview">Preview</v-button>
			</v-button-group>
		</div>

		<textarea ref="codemirrorEl" :value="value || ''" />

		<div v-if="view[0] === 'preview'" class="preview-box" v-html="html"></div>

		<v-dialog :active="imageDialogOpen" @esc="imageDialogOpen = null" @toggle="imageDialogOpen = null">
			<v-card>
				<v-card-title>{{ $t('upload_from_device') }}</v-card-title>
				<v-card-text>
					<v-upload @input="onImageUpload" from-url from-library />
				</v-card-text>
				<v-card-actions>
					<v-button @click="imageDialogOpen = null" secondary>{{ $t('cancel') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import {
	defineComponent,
	computed,
	ref,
	onMounted,
	onUnmounted,
	watch,
	reactive,
	PropType,
} from '@vue/composition-api';
import { sanitize } from 'dompurify';
import marked from 'marked';

import CodeMirror from 'codemirror';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/display/placeholder.js';

import { useEdit, CustomSyntax } from './composables/use-edit';
import { getPublicURL } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';
import escapeStringRegexp from 'escape-string-regexp';
import useShortcut from '@/composables/use-shortcut';
import translateShortcut from '@/utils/translate-shortcut';

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
		customSyntax: {
			type: Array as PropType<CustomSyntax[]>,
			default: () => [],
		},
		imageToken: {
			type: String,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const markdownInterface = ref<HTMLElement>();
		const codemirrorEl = ref<HTMLTextAreaElement>();
		const codemirror = ref<CodeMirror.EditorFromTextArea | null>(null);

		const view = ref(['editor']);

		const imageDialogOpen = ref(false);

		onMounted(async () => {
			if (codemirrorEl.value) {
				codemirror.value = CodeMirror.fromTextArea(codemirrorEl.value, {
					mode: 'markdown',
					configureMouse: () => ({ addNew: false }),
					lineWrapping: true,
					placeholder: props.placeholder,
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

		const { edit } = useEdit(codemirror, props.customSyntax);

		const html = computed(() => {
			let md = props.value || '';

			if (!props.imageToken) {
				const baseUrl = getPublicURL() + 'assets/';
				const regex = new RegExp(`\\]\\((${escapeStringRegexp(baseUrl)}[^\\s\\)]*)`, 'gm');

				const images = Array.from(md.matchAll(regex));

				for (const image of images) {
					md = md.replace(image[1], addTokenToURL(image[1]));
				}
			}

			const html = marked(md);
			const htmlSanitized = sanitize(html);

			return htmlSanitized;
		});

		const table = reactive({
			rows: 4,
			columns: 4,
		});

		useShortcut('meta+b', () => edit('bold'), markdownInterface);
		useShortcut('meta+i', () => edit('italic'), markdownInterface);
		useShortcut('meta+k', () => edit('link'), markdownInterface);
		useShortcut('meta+alt+d', () => edit('strikethrough'), markdownInterface);
		useShortcut('meta+alt+q', () => edit('blockquote'), markdownInterface);
		useShortcut('meta+alt+c', () => edit('code'), markdownInterface);
		useShortcut('meta+alt+1', () => edit('heading', { level: 1 }), markdownInterface);
		useShortcut('meta+alt+2', () => edit('heading', { level: 2 }), markdownInterface);
		useShortcut('meta+alt+3', () => edit('heading', { level: 3 }), markdownInterface);
		useShortcut('meta+alt+4', () => edit('heading', { level: 4 }), markdownInterface);
		useShortcut('meta+alt+5', () => edit('heading', { level: 5 }), markdownInterface);
		useShortcut('meta+alt+6', () => edit('heading', { level: 6 }), markdownInterface);

		return {
			codemirrorEl,
			edit,
			view,
			html,
			table,
			onImageUpload,
			imageDialogOpen,
			useShortcut,
			translateShortcut,
			markdownInterface,
		};

		function onImageUpload(image: any) {
			if (!codemirror.value) return;

			let url = getPublicURL() + `assets/` + image.id;

			if (props.imageToken) {
				url += '?access_token=' + props.imageToken;
			}

			codemirror.value.replaceSelection(`![](${url})`);

			imageDialogOpen.value = false;
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

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
	flex-wrap: wrap;
	min-height: 40px;
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

.table-options {
	@include form-grid;

	--form-vertical-gap: 12px;
	--form-horizontal-gap: 12px;

	padding: 12px;

	.v-input {
		min-width: 100px;
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
			margin-top: 40px;
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
			border-top: 2px solid #cfd8dc;
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
