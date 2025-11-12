<script setup lang="ts">
import { i18n } from '@/lang';
import { useInjectFocusTrapManager } from '@/composables/use-focus-trap-manager';
import { useSettingsStore } from '@/stores/settings';
import { percentage } from '@/utils/percentage';
import { SettingsStorageAssetPreset } from '@directus/types';
import Editor from '@tinymce/tinymce-vue';
import { cloneDeep, isEqual } from 'lodash';
import { ComponentPublicInstance, computed, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import getEditorStyles from './get-editor-styles';
import toolbarDefault from './toolbar-default';
import useImage from './useImage';
import useLink from './useLink';
import useMedia from './useMedia';
import useSourceCode from './useSourceCode';
import usePre from './usePre';
import useInlineCode from './useInlineCode';
import tinymce from 'tinymce/tinymce';

import 'tinymce/skins/ui/oxide/skin.css';
import './tinymce-overrides.css';

import 'tinymce/tinymce';

import 'tinymce/icons/default';
import 'tinymce/models/dom';
import 'tinymce/plugins/autoresize/plugin';
import 'tinymce/plugins/code/plugin';
import 'tinymce/plugins/directionality/plugin';
import 'tinymce/plugins/fullscreen/plugin';
import 'tinymce/plugins/image/plugin';
import 'tinymce/plugins/insertdatetime/plugin';
import 'tinymce/plugins/link/plugin';
import 'tinymce/plugins/lists/plugin';
import 'tinymce/plugins/media/plugin';
import 'tinymce/plugins/pagebreak/plugin';
import 'tinymce/plugins/preview/plugin';
import 'tinymce/plugins/table/plugin';
import 'tinymce/themes/silver';

type CustomFormat = {
	title: string;
	inline: string;
	classes: string;
	styles: Record<string, string>;
	attributes: Record<string, string>;
};

const props = withDefaults(
	defineProps<{
		value: string | null;
		disabled?: boolean;
		toolbar?: string[];
		font?: 'sans-serif' | 'serif' | 'monospace';
		customFormats?: CustomFormat[];
		tinymceOverrides?: Record<string, unknown>;
		imageToken?: string;
		folder?: string;
		softLength?: number;
		direction?: string;
	}>(),
	{
		toolbar: () => toolbarDefault,
		font: 'sans-serif',
		customFormats: () => [],
	},
);

const emit = defineEmits(['input', 'focus', 'blur']);

const { t } = useI18n();
const editorRef = ref<any | null>(null);
const editorElement = ref<ComponentPublicInstance | null>(null);
const editorKey = ref(0);

const { imageToken } = toRefs(props);
const settingsStore = useSettingsStore();

const storageAssetTransform = ref('all');
const storageAssetPresets = ref<SettingsStorageAssetPreset[]>([]);

if (settingsStore.settings?.storage_asset_transform) {
	storageAssetTransform.value = settingsStore.settings.storage_asset_transform;
	storageAssetPresets.value = settingsStore.settings.storage_asset_presets ?? [];
}

const count = ref(0);

const { imageDrawerOpen, imageSelection, closeImageDrawer, onImageSelect, saveImage, imageButton } = useImage(
	editorRef,
	imageToken!,
	{
		storageAssetTransform,
		storageAssetPresets,
	},
);

const {
	mediaDrawerOpen,
	mediaSelection,
	closeMediaDrawer,
	openMediaTab,
	onMediaSelect,
	embed,
	saveMedia,
	mediaHeight,
	mediaWidth,
	mediaSource,
	mediaButton,
} = useMedia(editorRef, imageToken!);

const { linkButton, linkDrawerOpen, closeLinkDrawer, saveLink, linkSelection, isLinkSaveable } = useLink(editorRef);

const { codeDrawerOpen, code, closeCodeDrawer, saveCode, sourceCodeButton } = useSourceCode(editorRef);

const { preButton } = usePre(editorRef);
const { inlineCodeButton } = useInlineCode(editorRef);

const internalValue = computed({
	get() {
		return props.value || '';
	},
	set(value) {
		if (props.value !== value) {
			contentUpdated();
		}
	},
});

const editorInitialized = ref(false);

const editorDisabled = computed(() => {
	if (!editorInitialized.value) return false;

	return props.disabled;
});

watch(
	() => [props.direction, editorRef],
	() => {
		if (editorRef.value) {
			if (props.direction === 'rtl') {
				editorRef.value.editorCommands?.commands?.exec?.mcedirectionrtl();
			} else {
				editorRef.value.editorCommands?.commands?.exec?.mcedirectionltr();
			}
		}
	},
);

watch(
	() => [props.toolbar, props.font, props.customFormats, props.tinymceOverrides],
	(newOptions, oldOptions) => {
		if (isEqual(newOptions, oldOptions)) return;

		editorRef.value.remove();
		editorInitialized.value = false;
		editorKey.value++;
	},
);

const editorOptions = computed(() => {
	const styleFormats =
		Array.isArray(props.customFormats) && props.customFormats.length > 0 ? cloneDeep(props.customFormats) : null;

	let toolbarString = (props.toolbar ?? [])
		.map((button) =>
			button
				.replace(/^link$/g, 'customLink')
				.replace(/^media$/g, 'customMedia')
				.replace(/^code$/g, 'customCode')
				.replace(/^image$/g, 'customImage')
				.replace(/^pre$/g, 'customPre')
				.replace(/^inlinecode$/g, 'customInlineCode'),
		)
		.join(' ');

	if (styleFormats) {
		toolbarString += ' styles';
	}

	return {
		skin: false,
		content_css: false,
		content_style: getEditorStyles(props.font as 'sans-serif' | 'serif' | 'monospace'),
		plugins: [
			'media',
			'table',
			'lists',
			'image',
			'link',
			'pagebreak',
			'code',
			'insertdatetime',
			'autoresize',
			'preview',
			'fullscreen',
			'directionality',
		],
		branding: false,
		max_height: 1000,
		elementpath: false,
		statusbar: false,
		menubar: false,
		convert_urls: false,
		image_dimensions: false,
		extended_valid_elements: 'audio[loop|controls],source[src|type]',
		toolbar: toolbarString ? toolbarString : false,
		style_formats: styleFormats,
		file_picker_types: 'customImage customMedia image media',
		link_default_protocol: 'https',
		browser_spellcheck: true,
		directionality: props.direction,
		paste_data_images: false,
		setup,
		language: i18n.global.locale.value,
		ui_mode: 'split',
		...(props.tinymceOverrides && cloneDeep(props.tinymceOverrides)),
	};
});

const percRemaining = computed(() => percentage(count.value, props.softLength) ?? 100);

let observer: MutationObserver;
let emittedValue: any;

function setCount() {
	const iframeContents = editorRef.value?.contentWindow.document.getElementById('tinymce');
	count.value = iframeContents?.textContent?.replace('\n', '')?.length ?? 0;
}

function contentUpdated() {
	setCount();

	if (!observer) return;

	const newValue = editorRef.value.getContent() ? editorRef.value.getContent() : null;

	if (newValue === emittedValue) return;

	emittedValue = newValue;
	emit('input', newValue);
}

function setupContentWatcher() {
	if (observer) return;

	const iframeContents = editorRef.value.contentWindow.document.getElementById('tinymce');

	observer = new MutationObserver((_mutations) => {
		contentUpdated();
	});

	const config = { characterData: true, childList: true, subtree: true };
	observer.observe(iframeContents, config);
}

function setup(editor: any) {
	editorRef.value = editor;

	const linkShortcut = 'meta+k';

	editor.ui.registry.addToggleButton('customPre', preButton);
	editor.ui.registry.addToggleButton('customImage', imageButton);
	editor.ui.registry.addToggleButton('customMedia', mediaButton);
	editor.ui.registry.addToggleButton('customLink', { ...linkButton, shortcut: linkShortcut });

	editor.ui.registry.addToggleButton('customInlineCode', inlineCodeButton);
	editor.ui.registry.addButton('customCode', sourceCodeButton);

	editor.on('init', function () {
		editor.shortcuts.remove(linkShortcut);

		editor.addShortcut(linkShortcut, 'Insert Link', () => {
			editor.ui.registry.getAll().buttons.customlink.onAction();
		});

		setCount();

		editorInitialized.value = true;
	});

	editor.on('OpenWindow', function (e: any) {
		if (e.dialog?.getData) {
			const data = e.dialog?.getData();

			if (data) {
				if (data.url) {
					e.dialog.close();
					editor.ui.registry.getAll().buttons.customlink.onAction();
				}

				if (data.src) {
					e.dialog.close();
					editor.ui.registry.getAll().buttons.customimage.onAction(true);
				}
			}
		}
	});

	let pausedFocusTrap = false;
	editor.on('OpenWindow', onOpenWindow);
	editor.on('CloseWindow', onCloseWindow);

	const { pauseFocusTrap, unpauseFocusTrap } = useInjectFocusTrapManager();

	function onOpenWindow() {
		const toxDialogEl = document.querySelector('.tox-dialog') as HTMLElement | null;
		if (toxDialogEl === null) return;

		const firstFocusableElement = getFirstFocusableElement(toxDialogEl);
		if (!firstFocusableElement) return;

		pausedFocusTrap = true;
		pauseFocusTrap();
		firstFocusableElement.focus();
	}

	function getFirstFocusableElement(toxDialogEl: HTMLElement) {
		// TinyMCE adds tabindex="-1" to all focusable elements in the dialog
		const findElement = toxDialogEl.querySelector('[tabindex="-1"]') as HTMLElement | null;
		if (!findElement) return;

		// To shift the focus to this dialog, we need to make this element focusable
		findElement.tabIndex = 0;
		return findElement;
	}

	function onCloseWindow() {
		if (!pausedFocusTrap) return;

		pausedFocusTrap = false;
		unpauseFocusTrap();
	}
}

function setFocus(val: boolean) {
	if (editorElement.value == null) return;
	const body = editorElement.value.$el.parentElement?.querySelector('.tox-tinymce');

	if (body == null) return;

	if (val) {
		emit('focus');
		body.classList.add('focus');
	} else {
		emit('blur');
		body.classList.remove('focus');
	}
}

onMounted(() => {
	tinymce.addI18n(i18n.global.locale.value, {
		Undo: t('wysiwyg_options.undo'),
		Redo: t('wysiwyg_options.redo'),
		Bold: t('wysiwyg_options.bold'),
		Italic: t('wysiwyg_options.italic'),
		Underline: t('wysiwyg_options.underline'),
		Strikethrough: t('wysiwyg_options.strikethrough'),
		Subscript: t('wysiwyg_options.subscript'),
		Superscript: t('wysiwyg_options.superscript'),
		'Font {0}': `${t('wysiwyg_options.fontselect')} {0}`,
		'Font size {0}': `${t('wysiwyg_options.fontsizeselect')} {0}`,
		'Heading 1': t('wysiwyg_options.h1'),
		'Heading 2': t('wysiwyg_options.h2'),
		'Heading 3': t('wysiwyg_options.h3'),
		'Heading 4': t('wysiwyg_options.h4'),
		'Heading 5': t('wysiwyg_options.h5'),
		'Heading 6': t('wysiwyg_options.h6'),
		'Align center': t('wysiwyg_options.aligncenter'),
		'Align left': t('wysiwyg_options.alignleft'),
		'Align right': t('wysiwyg_options.alignright'),
		Justify: t('wysiwyg_options.alignjustify'),
		'No alignment': t('wysiwyg_options.alignnone'),
		'Increase indent': t('wysiwyg_options.indent'),
		'Decrease indent': t('wysiwyg_options.outdent'),
		'Numbered list': t('wysiwyg_options.numlist'),
		'Bullet list': t('wysiwyg_options.bullist'),
		'Text color {0}': `${t('wysiwyg_options.forecolor')} {0}`,
		'Background color {0}': `${t('wysiwyg_options.backcolor')} {0}`,
		'Clear formatting': t('wysiwyg_options.removeformat'),
		Cut: t('wysiwyg_options.cut'),
		Copy: t('wysiwyg_options.copy'),
		Paste: t('wysiwyg_options.paste'),
		Remove: t('wysiwyg_options.remove'),
		'Select all': t('wysiwyg_options.selectall'),
		Blockquote: t('wysiwyg_options.blockquote'),
		Fullscreen: t('wysiwyg_options.fullscreen'),
		Table: t('wysiwyg_options.table'),
		'Horizontal line': t('wysiwyg_options.hr'),
		'Visual aids': t('wysiwyg_options.visualaid'),
		'Left to right': t('left_to_right'),
		'Right to left': t('right_to_left'),
	});
});
</script>

<template>
	<div :id="field" class="wysiwyg" :class="{ disabled }">
		<editor
			:key="editorKey"
			ref="editorElement"
			v-model="internalValue"
			:init="editorOptions"
			:disabled="editorDisabled"
			model-events="change keydown blur focus paste ExecCommand SetContent"
			@focusin="setFocus(true)"
			@focusout="setFocus(false)"
			@focus="setupContentWatcher"
			@set-content="contentUpdated"
		/>
		<template v-if="softLength">
			<span
				class="remaining"
				:class="{
					warning: percRemaining < 10,
					danger: percRemaining < 5,
				}"
			>
				{{ softLength - count }}
			</span>
		</template>
		<v-dialog v-model="linkDrawerOpen" @esc="closeLinkDrawer" @apply="saveLink">
			<v-card>
				<v-card-title>{{ t('wysiwyg_options.link') }}</v-card-title>
				<v-card-text>
					<div class="grid">
						<div class="field">
							<div class="type-label">{{ t('url') }}</div>
							<v-input v-model="linkSelection.url" :placeholder="t('url_placeholder')" autofocus></v-input>
						</div>
						<div class="field">
							<div class="type-label">{{ t('display_text') }}</div>
							<v-input v-model="linkSelection.displayText" :placeholder="t('display_text_placeholder')"></v-input>
						</div>
						<div class="field half">
							<div class="type-label">{{ t('tooltip') }}</div>
							<v-input v-model="linkSelection.title" :placeholder="t('tooltip_placeholder')"></v-input>
						</div>
						<div class="field half-right">
							<div class="type-label">{{ t('open_link_in') }}</div>
							<v-checkbox v-model="linkSelection.newTab" block :label="t('new_tab')"></v-checkbox>
						</div>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="closeLinkDrawer">{{ t('cancel') }}</v-button>
					<v-button :disabled="!isLinkSaveable" @click="saveLink">{{ t('save') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-drawer
			v-model="codeDrawerOpen"
			:title="t('wysiwyg_options.source_code')"
			icon="code"
			@cancel="closeCodeDrawer"
			@apply="saveCode"
		>
			<div class="content">
				<interface-input-code
					:value="code"
					language="htmlmixed"
					line-wrapping
					@input="code = $event"
				></interface-input-code>
			</div>

			<template #actions>
				<v-button icon rounded @click="saveCode">
					<v-icon name="check" />
				</v-button>
			</template>
		</v-drawer>

		<v-drawer
			v-model="imageDrawerOpen"
			:title="t('wysiwyg_options.image')"
			icon="image"
			@cancel="closeImageDrawer"
			@apply="saveImage"
		>
			<div class="content">
				<template v-if="imageSelection">
					<img class="image-preview" :src="imageSelection.previewUrl" />
					<div class="grid">
						<div class="field half">
							<div class="type-label">{{ t('image_url') }}</div>
							<v-input v-model="imageSelection.imageUrl" />
						</div>
						<div class="field half-right">
							<div class="type-label">{{ t('alt_text') }}</div>
							<v-input v-model="imageSelection.alt" :nullable="false" />
						</div>
						<template v-if="storageAssetTransform === 'all'">
							<div class="field half">
								<div class="type-label">{{ t('width') }}</div>
								<v-input v-model="imageSelection.width" :disabled="!!imageSelection.transformationKey" />
							</div>
							<div class="field half-right">
								<div class="type-label">{{ t('height') }}</div>
								<v-input v-model="imageSelection.height" :disabled="!!imageSelection.transformationKey" />
							</div>
						</template>
						<div class="field half">
							<div class="type-label">{{ t('wysiwyg_options.lazy_loading') }}</div>
							<v-checkbox v-model="imageSelection.lazy" block :label="t('wysiwyg_options.lazy_loading_label')" />
						</div>
						<div v-if="storageAssetTransform !== 'none' && storageAssetPresets.length > 0" class="field half">
							<div class="type-label">{{ t('transformation_preset_key') }}</div>
							<v-select
								v-model="imageSelection.transformationKey"
								:items="storageAssetPresets.map((preset) => ({ text: preset.key, value: preset.key }))"
								show-deselect
							/>
						</div>
					</div>
				</template>
				<v-upload v-else :multiple="false" from-library from-url :folder="folder" @input="onImageSelect" />
			</div>

			<template #actions>
				<v-button v-tooltip.bottom="t('save_image')" icon rounded @click="saveImage">
					<v-icon name="check" />
				</v-button>
			</template>
		</v-drawer>

		<v-drawer
			v-model="mediaDrawerOpen"
			:title="t('wysiwyg_options.media')"
			icon="slideshow"
			@cancel="closeMediaDrawer"
			@apply="saveMedia"
		>
			<template #sidebar>
				<v-tabs v-model="openMediaTab" vertical>
					<v-tab value="video">{{ t('media') }}</v-tab>
					<v-tab value="embed">{{ t('embed') }}</v-tab>
				</v-tabs>
			</template>

			<div class="content">
				<v-tabs-items v-model="openMediaTab">
					<v-tab-item value="video">
						<template v-if="mediaSelection">
							<video v-if="mediaSelection.tag !== 'iframe'" class="media-preview" controls="true">
								<source :src="mediaSelection.previewUrl" />
							</video>
							<iframe
								v-if="mediaSelection.tag === 'iframe'"
								:title="$t('interfaces.input-rich-text-html.media_preview_iframe_title')"
								class="media-preview"
								:src="mediaSelection.previewUrl"
							></iframe>
							<div class="grid">
								<div class="field">
									<div class="type-label">{{ t('source') }}</div>
									<v-input v-model="mediaSource" />
								</div>
								<div class="field half">
									<div class="type-label">{{ t('width') }}</div>
									<v-input v-model="mediaWidth" />
								</div>
								<div class="field half-right">
									<div class="type-label">{{ t('height') }}</div>
									<v-input v-model="mediaHeight" />
								</div>
							</div>
						</template>
						<v-upload v-else :multiple="false" from-library from-url :folder="folder" @input="onMediaSelect" />
					</v-tab-item>
					<v-tab-item value="embed">
						<div class="grid">
							<div class="field">
								<div class="type-label">{{ t('embed') }}</div>
								<v-textarea v-model="embed" :nullable="false" />
							</div>
						</div>
					</v-tab-item>
				</v-tabs-items>
			</div>

			<template #actions>
				<v-button v-tooltip.bottom="t('save_media')" icon rounded @click="saveMedia">
					<v-icon name="check" />
				</v-button>
			</template>
		</v-drawer>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.body {
	padding: 20px;
}

.grid {
	@include mixins.form-grid;
}

.remaining {
	position: absolute;
	inset-inline-end: 10px;
	inset-block-end: 5px;
	color: var(--theme--form--field--input--foreground-subdued);
	font-weight: 600;
	text-align: end;
	vertical-align: middle;
	font-feature-settings: 'tnum';
}

.warning {
	color: var(--theme--warning);
}

.danger {
	color: var(--theme--danger);
}

.image-preview,
.media-preview {
	inline-size: 100%;
	block-size: var(--input-height-tall);
	margin-block-end: 24px;
	object-fit: cover;
	border-radius: var(--theme--border-radius);
}

.content {
	padding: var(--content-padding);
	padding-block: 0 var(--content-padding);
}
</style>
