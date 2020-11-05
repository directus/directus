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
			default: 'serif',
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
	},
	setup(props, { emit }) {
		const editorElement = ref<Vue | null>(null);

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
				content_style: getEditorStyles(props.font as 'sans-serif' | 'serif' | 'monospace', props.disabled),
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
				...(props.tinymceOverrides || {}),
			};
		});

		return { editorElement, editorOptions, _value, setFocus };

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
