<template>
	<div class="wysiwyg" :class="{ disabled }">
		<Editor
			ref="editorElement"
			:init="editorOptions"
			:disabled="disabled"
			v-model="_value"
			@onFocusIn="setFocus(true)"
			@onFocusOut="setFocus(false)"
		/>
		<v-dialog :active="_imageDialogOpen" @toggle="unsetImageUploadHandler" @esc="unsetImageUploadHandler">
			<v-card>
				<v-card-title>{{ $t('upload_from_device') }}</v-card-title>
				<v-card-text>
					<v-upload @input="onImageUpload" :multiple="false" from-library from-url />
				</v-card-text>
				<v-card-actions>
					<v-button @click="unsetImageUploadHandler" secondary>{{ $t('cancel') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';

import 'tinymce/tinymce';
import 'tinymce/themes/silver';
import 'tinymce/plugins/media/plugin';
import 'tinymce/plugins/table/plugin';
import 'tinymce/plugins/hr/plugin';
import 'tinymce/plugins/lists/plugin';
import 'tinymce/plugins/image/plugin';
import 'tinymce/plugins/imagetools/plugin';
import 'tinymce/plugins/link/plugin';
import 'tinymce/plugins/pagebreak/plugin';
import 'tinymce/plugins/code/plugin';
import 'tinymce/plugins/insertdatetime/plugin';
import 'tinymce/plugins/autoresize/plugin';
import 'tinymce/plugins/paste/plugin';
import 'tinymce/plugins/preview/plugin';
import 'tinymce/plugins/fullscreen/plugin';
import 'tinymce/plugins/directionality/plugin';
import 'tinymce/icons/default';

import Editor from '@tinymce/tinymce-vue';

import getEditorStyles from './get-editor-styles';

import { getPublicURL } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';

type CustomFormat = {
	title: string;
	inline: string;
	classes: string;
	styles: Record<string, string>;
	attributes: Record<string, string>;
};

export default defineComponent({
	components: { Editor },
	props: {
		value: {
			type: String,
			default: '',
		},
		toolbar: {
			type: Array as PropType<string[]>,
			default: () => [
				'bold',
				'italic',
				'underline',
				'removeformat',
				'link',
				'bullist',
				'numlist',
				'blockquote',
				'h1',
				'h2',
				'h3',
				'image',
				'media',
				'hr',
				'code',
				'fullscreen',
			],
		},
		font: {
			type: String as PropType<'sans-serif' | 'serif' | 'monospace'>,
			default: 'sans-serif',
		},
		customFormats: {
			type: Array as PropType<CustomFormat[]>,
			default: () => [],
		},
		tinymceOverrides: {
			type: Object,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: true,
		},
		imageToken: {
			type: String,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const editorElement = ref<Vue | null>(null);
		const imageUploadHandler = ref<CallableFunction | null>(null);

		const _imageDialogOpen = computed(() => !!imageUploadHandler.value);

		const _value = computed({
			get() {
				return props.value;
			},
			set(newValue: string) {
				emit('input', newValue);
			},
		});

		const editorOptions = computed(() => {
			let styleFormats = null;

			if (Array.isArray(props.customFormats) && props.customFormats.length > 0) {
				styleFormats = props.customFormats;
			}

			let toolbarString = props.toolbar.join(' ');

			if (styleFormats) {
				toolbarString += ' styleselect';
			}

			return {
				skin: false,
				skin_url: false,
				content_css: false,
				content_style: getEditorStyles(props.font as 'sans-serif' | 'serif' | 'monospace'),
				plugins:
					'media table hr lists image link pagebreak code insertdatetime autoresize paste preview fullscreen directionality',
				branding: false,
				max_height: 1000,
				elementpath: false,
				statusbar: false,
				menubar: false,
				convert_urls: false,
				extended_valid_elements: 'audio[loop],source',
				toolbar: toolbarString,
				style_formats: styleFormats,
				file_picker_types: 'image media',
				file_picker_callback: setImageUploadHandler,
				urlconverter_callback: urlConverter,
				link_default_protocol: 'https',
				...(props.tinymceOverrides || {}),
			};
		});

		return {
			editorElement,
			editorOptions,
			_value,
			setFocus,
			onImageUpload,
			unsetImageUploadHandler,
			_imageDialogOpen,
		};

		function onImageUpload(file: Record<string, any>) {
			if (imageUploadHandler.value) imageUploadHandler.value(file);
			unsetImageUploadHandler();
		}

		function setImageUploadHandler(cb: CallableFunction, value: any, meta: Record<string, any>) {
			imageUploadHandler.value = (result: Record<string, any>) => {
				if (meta.filetype === 'image' && !/^image\//.test(result.type)) return;

				const imageUrl = getPublicURL() + 'assets/' + result.id;

				cb(imageUrl, {
					alt: result.title,
					title: result.title,
					width: (result.width || '').toString(),
					height: (result.height || '').toString(),
				});
			};
		}

		function urlConverter(url: string, node: string) {
			if (url && props.imageToken && ['img', 'source', 'poster', 'audio'].includes(node)) {
				const baseUrl = getPublicURL() + 'assets/';
				if (url.includes(baseUrl)) {
					url = addTokenToURL(url, props.imageToken);
				}
			}
			return url;
		}

		function unsetImageUploadHandler() {
			imageUploadHandler.value = null;
		}

		function setFocus(val: boolean) {
			if (editorElement.value == null) return;
			const body = editorElement.value.$el.parentElement?.querySelector('.tox-tinymce');

			if (body == null) return;
			if (val) {
				body.classList.add('focus');
			} else {
				body.classList.remove('focus');
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.body {
	padding: 20px;
}

@import '~tinymce/skins/ui/oxide/skin.css';
@import './tinymce-overrides.css';
</style>
