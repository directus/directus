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
		<v-drawer v-model="imageDrawerOpen" :title="$t('wysiwyg_options.image')" @cancel="closeImageDrawer" icon="image">
			<div class="content">
				<template v-if="imageSelection">
					<img class="image-preview" :src="imageSelection.imageUrl" />
					<div class="grid">
						<div class="field half">
							<div class="type-label">{{ $t('image_url') }}</div>
							<v-input v-model="imageSelection.imageUrl" />
						</div>
						<div class="field half-right">
							<div class="type-label">{{ $t('alt_text') }}</div>
							<v-input v-model="imageSelection.alt" />
						</div>
						<div class="field half">
							<div class="type-label">{{ $t('width') }}</div>
							<v-input v-model="imageSelection.width" />
						</div>
						<div class="field half-right">
							<div class="type-label">{{ $t('height') }}</div>
							<v-input v-model="imageSelection.height" />
						</div>
					</div>
				</template>
				<v-upload v-else @input="onImageSelect" :multiple="false" from-library from-url />
			</div>

			<template #actions>
				<v-button @click="saveImage" v-tooltip.bottom="$t('save_image')" icon rounded>
					<v-icon name="check" />
				</v-button>
			</template>
		</v-drawer>

		<v-drawer
			v-model="mediaDrawerOpen"
			:title="$t('wysiwyg_options.media')"
			@cancel="closeMediaDrawer"
			icon="slideshow"
		>
			<template #sidebar>
				<v-tabs v-model="openMediaTab" vertical>
					<v-tab value="video">{{ $t('media') }}</v-tab>
					<v-tab value="embed">{{ $t('embed') }}</v-tab>
				</v-tabs>
			</template>

			<div class="content">
				<v-tabs-items v-model="openMediaTab">
					<v-tab-item value="video">
						<template v-if="mediaSelection">
							<video class="media-preview" controls="controls">
								<source :src="mediaSelection.source" />
							</video>
							<div class="grid">
								<div class="field">
									<div class="type-label">{{ $t('source') }}</div>
									<v-input v-model="mediaSource" />
								</div>
								<div class="field half">
									<div class="type-label">{{ $t('width') }}</div>
									<v-input v-model="mediaWidth" />
								</div>
								<div class="field half-right">
									<div class="type-label">{{ $t('height') }}</div>
									<v-input v-model="mediaHeight" />
								</div>
							</div>
						</template>
						<v-upload v-else @input="onMediaSelect" :multiple="false" from-library from-url />
					</v-tab-item>
					<v-tab-item value="embed">
						<div class="grid">
							<div class="field">
								<div class="type-label">{{ $t('embed') }}</div>
								<v-textarea v-model="embed" />
							</div>
						</div>
					</v-tab-item>
				</v-tabs-items>
			</div>

			<template #actions>
				<v-button @click="saveMedia" v-tooltip.bottom="$t('save_media')" icon rounded>
					<v-icon name="check" />
				</v-button>
			</template>
		</v-drawer>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from '@vue/composition-api';

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
import i18n from '@/lang';
import { start } from '@popperjs/core';

type CustomFormat = {
	title: string;
	inline: string;
	classes: string;
	styles: Record<string, string>;
	attributes: Record<string, string>;
};

type ImageSelection = {
	imageUrl: string;
	alt: string;
	width?: number;
	height?: number;
};

type MediaSelection = {
	source: string;
	width?: number;
	height?: number;
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
				'customImage',
				'customMedia',
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
		const editorRef = ref<any | null>(null);
		const editorElement = ref<Vue | null>(null);

		const { imageDrawerOpen, imageSelection, closeImageDrawer, onImageSelect, saveImage } = useImage();
		const {
			mediaDrawerOpen,
			mediaSelection,
			closeMediaDrawer,
			openMediaTab,
			onMediaSelect,
			embed,
			saveMedia,
			startEmbed,
			mediaHeight,
			mediaWidth,
			mediaSource,
		} = useMedia();

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
				file_picker_types: 'customImage image media',
				link_default_protocol: 'https',
				...(props.tinymceOverrides || {}),
				setup,
			};
		});

		return {
			editorElement,
			editorOptions,
			_value,
			setFocus,
			onImageSelect,
			saveImage,
			imageDrawerOpen,
			closeImageDrawer,
			imageSelection,
			mediaDrawerOpen,
			mediaSelection,
			closeMediaDrawer,
			openMediaTab,
			embed,
			onMediaSelect,
			saveMedia,
			mediaHeight,
			mediaWidth,
			mediaSource,
		};

		function setup(editor: any) {
			editorRef.value = editor;

			editor.ui.registry.addToggleButton('customImage', {
				icon: 'image',
				tooltip: i18n.t('wysiwyg_options.image'),
				onAction: (buttonApi: any) => {
					imageDrawerOpen.value = true;

					if (buttonApi.isActive()) {
						const node = editor.selection.getNode() as HTMLImageElement;
						const imageUrl = node.getAttribute('src');
						const alt = node.getAttribute('alt');

						if (imageUrl === null || alt === null) {
							return;
						}

						imageSelection.value = {
							imageUrl,
							alt,
							width: Number(node.getAttribute('width')) || undefined,
							height: Number(node.getAttribute('height')) || undefined,
						};
					} else {
						imageSelection.value = null;
					}
				},
				onSetup: (buttonApi: any) => {
					const onImageNodeSelect = (eventApi: any) => {
						buttonApi.setActive(eventApi.element.tagName === 'IMG');
					};

					editor.on('NodeChange', onImageNodeSelect);

					return function (buttonApi: any) {
						editor.off('NodeChange', onImageNodeSelect);
					};
				},
			});

			editor.ui.registry.addToggleButton('customMedia', {
				icon: 'embed',
				tooltip: i18n.t('wysiwyg_options.media'),
				onAction: (buttonApi: any) => {
					mediaDrawerOpen.value = true;

					if (buttonApi.isActive()) {
						if (editor.selection.getContent() === null) return;

						embed.value = editor.selection.getContent();
						startEmbed.value = embed.value;
					} else {
						mediaSelection.value = null;
					}
				},
				onSetup: (buttonApi: any) => {
					const onVideoNodeSelect = (eventApi: any) => {
						buttonApi.setActive(
							eventApi.element.tagName === 'SPAN' && eventApi.element.classList.contains('mce-preview-object')
						);
					};

					editor.on('NodeChange', onVideoNodeSelect);

					return function (buttonApi: any) {
						editor.off('NodeChange', onVideoNodeSelect);
					};
				},
			});
		}

		function useMedia() {
			const mediaDrawerOpen = ref(false);
			const mediaSelection = ref<MediaSelection | null>(null);
			const openMediaTab = ref(['video']);
			const embed = ref('');
			const startEmbed = ref('');

			const mediaSource = computed({
				get() {
					return mediaSelection.value?.source;
				},
				set(newSource: any) {
					mediaSelection.value = { ...mediaSelection.value, source: newSource };
				},
			});

			const mediaWidth = computed({
				get() {
					return mediaSelection.value?.width;
				},
				set(newSource: number | undefined) {
					if (mediaSelection.value === null) return;
					mediaSelection.value = { ...mediaSelection.value, width: newSource };
				},
			});

			const mediaHeight = computed({
				get() {
					return mediaSelection.value?.height;
				},
				set(newSource: number | undefined) {
					if (mediaSelection.value === null) return;
					mediaSelection.value = { ...mediaSelection.value, height: newSource };
				},
			});

			watch(mediaSelection, (vid) => {
				console.log('Hi');
				if (embed.value === '') {
					if (vid === null) return;
					embed.value = `<video width="${vid.width}" height="${vid.height}" controls="controls"><source src="${vid.source}" /></video>`;
				} else {
					embed.value = embed.value
						.replace(/src=".*?"/g, `src="${vid?.source}"`)
						.replace(/width=".*?"/g, `width="${vid?.width}"`)
						.replace(/height=".*?"/g, `height="${vid?.height}"`);
				}
			});

			watch(embed, (newEmbed) => {
				if (newEmbed === '') {
					mediaSelection.value = null;
				} else {
					const source = /src="(.*?)"/g.exec(newEmbed)?.[1] || undefined;
					const width = Number(/width="(.*?)"/g.exec(newEmbed)?.[1]) || undefined;
					const height = Number(/height="(.*?)"/g.exec(newEmbed)?.[1]) || undefined;

					if (source === undefined) return;

					mediaSelection.value = {
						source,
						width,
						height,
					};
				}
			});

			return {
				mediaDrawerOpen,
				mediaSelection,
				closeMediaDrawer,
				openMediaTab,
				onMediaSelect,
				embed,
				saveMedia,
				startEmbed,
				mediaHeight,
				mediaWidth,
				mediaSource,
			};

			function closeMediaDrawer() {
				embed.value = '';
				startEmbed.value = '';
				mediaSelection.value = null;
				mediaDrawerOpen.value = false;
				openMediaTab.value = ['video'];
			}

			function onMediaSelect(media: Record<string, any>) {
				const source = addTokenToURL(getPublicURL() + 'assets/' + media.id, props.imageToken);

				mediaSelection.value = {
					source,
					width: media.width || 300,
					height: media.height || 150,
				};
			}

			function saveMedia() {
				if (embed.value === '') return;

				console.log('startEmbed', startEmbed.value);
				if (startEmbed.value !== '') {
					const updatedContent = editorRef.value.getContent().replace(startEmbed.value, embed.value);
					console.log(updatedContent, embed.value);
					editorRef.value.setContent(updatedContent);
				} else {
					editorRef.value.selection.setContent(embed.value);
				}
				closeMediaDrawer();
			}
		}

		function useImage() {
			const imageDrawerOpen = ref(false);
			const imageSelection = ref<ImageSelection | null>(null);

			return { imageDrawerOpen, imageSelection, closeImageDrawer, onImageSelect, saveImage };

			function closeImageDrawer() {
				imageSelection.value = null;
				imageDrawerOpen.value = false;
			}

			function onImageSelect(image: Record<string, any>) {
				const imageUrl = addTokenToURL(getPublicURL() + 'assets/' + image.id, props.imageToken);

				imageSelection.value = {
					imageUrl,
					alt: image.title,
					width: image.width,
					height: image.height,
				};
			}

			function saveImage() {
				const img = imageSelection.value;
				if (img === null) return;
				const imageHtml = `<img src="${img.imageUrl}" alt="${img.alt}" width="${img.width}" height="${img.height}" />`;
				editorRef.value.selection.setContent(imageHtml);
				closeImageDrawer();
			}
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
@import '@/styles/mixins/form-grid';

.grid {
	@include form-grid;
}

.image-preview,
.media-preview {
	width: 100%;
	height: var(--input-height-tall);
	margin-bottom: 24px;
	border-radius: var(--border-radius);
	object-fit: cover;
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>
