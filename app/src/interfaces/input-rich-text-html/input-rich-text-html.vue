<script setup lang="ts">
import { useThemeConfiguration } from '@/composables/use-theme-configuration';
import { useSettingsStore } from '@/stores/settings';
import { percentage } from '@/utils/percentage';
import { SettingsStorageAssetPreset } from '@directus/types';
import Editor from '@tinymce/tinymce-vue';
import { computedAsync } from '@vueuse/core';
import { Editor as TinyMCE } from 'tinymce';
import { ComponentPublicInstance, computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getEditorStyles } from './lib/get-editor-styles';
import { getLanguage } from './lib/get-language';
import { ImageButton, useImage } from './lib/use-image';
import { LinkButton, useLink } from './lib/use-link';
import { useMedia } from './lib/use-media';
import { useSourceCode } from './lib/use-source-code';

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
import './lib/icons';

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
		field?: string;
		toolbar?: string[];
		font?: 'sans-serif' | 'serif' | 'monospace';
		customFormats?: CustomFormat[];
		tinymceOverrides?: Record<string, unknown>;
		disabled?: boolean;
		imageToken?: string;
		folder?: string;
		softLength?: number;
		direction?: string;
	}>(),
	{
		toolbar: () => [
			'bold',
			'italic',
			'underline',
			'h1',
			'h2',
			'h3',
			'numlist',
			'bullist',
			'removeformat',
			'blockquote',
			'customLink',
			'customImage',
			'customMedia',
			'code',
			'fullscreen',
		],
		font: 'sans-serif',
		customFormats: () => [],
	},
);

const emit = defineEmits(['input']);

const { t } = useI18n();
const editorRef = ref<TinyMCE>();
const editorElement = ref<ComponentPublicInstance | null>(null);
const { imageToken } = toRefs(props);
const settingsStore = useSettingsStore();
const { darkMode } = useThemeConfiguration();

const editorInitialized = ref(false);
const count = ref(0);

const storageAssetTransform = ref('all');
const storageAssetPresets = ref<SettingsStorageAssetPreset[]>([]);

if (settingsStore.settings?.storage_asset_transform) {
	storageAssetTransform.value = settingsStore.settings.storage_asset_transform;
	storageAssetPresets.value = settingsStore.settings.storage_asset_presets ?? [];
}

const { imageDrawerOpen, imageSelection, closeImageDrawer, onImageSelect, saveImage, imageButton } = useImage(
	editorRef,
	imageToken,
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
} = useMedia(editorRef, imageToken);

const { linkButton, linkDrawerOpen, closeLinkDrawer, saveLink, linkSelection, linkNode } = useLink(editorRef);

const { codeDrawerOpen, code, closeCodeDrawer, saveCode, sourceCodeButton } = useSourceCode(editorRef);

watch(darkMode, () => {
	const domStyleElement = editorRef.value?.iframeElement?.contentDocument?.getElementsByTagName('style')?.[1];

	if (!domStyleElement) return;

	const styles = getEditorStyles(props.font);
	domStyleElement.innerHTML = styles;
});

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

const editorDisabled = computed(() => {
	if (!editorInitialized.value) return false;

	return props.disabled;
});

const language = computedAsync(getLanguage, null);

const editorOptions = computed(() => {
	if (language.value === null) return;

	let styleFormats = null;

	if (Array.isArray(props.customFormats) && props.customFormats.length > 0) {
		styleFormats = props.customFormats;
	}

	let toolbarString = (props.toolbar ?? [])
		.map((item) =>
			item
				.replace(/^link$/g, 'customLink')
				.replace(/^media$/g, 'customMedia')
				.replace(/^code$/g, 'customCode')
				.replace(/^image$/g, 'customImage'),
		)
		.join(' ');

	if (styleFormats) {
		toolbarString += ' styles';
	}

	return {
		skin: false,
		content_css: false,
		content_style: getEditorStyles(props.font),
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
		icons: 'material',
		license_key: 'gpl',
		branding: false,
		max_height: 1000,
		elementpath: false,
		statusbar: false,
		menubar: false,
		highlight_on_focus: false,
		convert_urls: false,
		image_dimensions: false,
		extended_valid_elements: 'audio[loop|controls],source[src|type]',
		toolbar: toolbarString,
		style_formats: styleFormats,
		file_picker_types: 'customImage customMedia image media',
		link_default_protocol: 'https',
		browser_spellcheck: true,
		directionality: props.direction,
		language: language.value,
		paste_data_images: false,
		setup,
		...(props.tinymceOverrides || {}),
	};
});

const percRemaining = computed(() => percentage(count.value, props.softLength) ?? 100);

let observer: MutationObserver | undefined;
let emittedValue: string | null | undefined;

function setCount() {
	if (props.softLength === undefined) return;

	const iframeContents = editorRef.value?.contentWindow.document.getElementById('tinymce');
	count.value = iframeContents?.textContent?.replace('\n', '')?.length ?? 0;
}

function contentUpdated() {
	if (!observer) {
		setCount();
		return;
	}

	const newValue = editorRef.value?.getContent() || null;

	if (newValue === emittedValue) return;

	emittedValue = newValue;
	emit('input', newValue);
	setCount();
}

function setupContentWatcher() {
	if (observer) return;

	const iframeContents = editorRef.value?.contentWindow.document.getElementById('tinymce');

	if (!iframeContents) return;

	observer = new MutationObserver(() => {
		contentUpdated();
	});

	observer.observe(iframeContents, { characterData: true, childList: true, subtree: true });
}

function setup(editor: TinyMCE) {
	editorRef.value = editor;

	const LINK_SHORTCUT = 'meta+k';

	editor.ui.registry.addToggleButton('customImage', imageButton);
	editor.ui.registry.addToggleButton('customMedia', mediaButton);
	editor.ui.registry.addToggleButton('customLink', { ...linkButton, shortcut: LINK_SHORTCUT });
	editor.ui.registry.addButton('customCode', sourceCodeButton);

	editor.on('init', function () {
		editor.shortcuts.remove(LINK_SHORTCUT);

		editor.addShortcut(LINK_SHORTCUT, 'Insert Link', () => {
			(editor.ui.registry.getAll().buttons.customlink as LinkButton).onAction();
		});

		setCount();

		editorInitialized.value = true;
	});

	editor.on('OpenWindow', (event) => {
		if ('getData' in event.dialog) {
			const data = event.dialog.getData();

			if (!data) return;

			if (data.url) {
				event.dialog.close();
				(editor.ui.registry.getAll().buttons.customlink as LinkButton).onAction();
			}

			if (data.src) {
				event.dialog.close();
				(editor.ui.registry.getAll().buttons.customimage as ImageButton).onAction(true);
			}
		}
	});
}

function setFocus(value: boolean) {
	const body = editorElement.value?.$el.parentElement?.querySelector('.tox-tinymce');

	if (!body) return;

	if (value) {
		body.classList.add('focus');
	} else {
		body.classList.remove('focus');
	}
}
</script>

<template>
	<div :id="field" class="wysiwyg" :class="{ disabled }">
		<editor
			v-if="editorOptions"
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

		<v-dialog v-model="linkDrawerOpen">
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
							<v-checkbox
								v-model="linkSelection.newTab"
								block
								:label="t(linkSelection.newTab ? 'new_tab' : 'current_tab')"
							></v-checkbox>
						</div>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="closeLinkDrawer">{{ t('cancel') }}</v-button>
					<v-button :disabled="linkSelection.url === null && !linkNode" @click="saveLink">{{ t('save') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-drawer v-model="codeDrawerOpen" :title="t('wysiwyg_options.source_code')" icon="code" @cancel="closeCodeDrawer">
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

		<v-drawer v-model="imageDrawerOpen" :title="t('wysiwyg_options.image')" icon="image" @cancel="closeImageDrawer">
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

		<v-drawer v-model="mediaDrawerOpen" :title="t('wysiwyg_options.media')" icon="slideshow" @cancel="closeMediaDrawer">
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

<style lang="scss">
@import 'tinymce/skins/ui/oxide/skin.css';
@import './styles/tinymce-overrides.css';
</style>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.grid {
	@include form-grid;
}

.remaining {
	position: absolute;
	right: 10px;
	bottom: 5px;
	color: var(--theme--form--field--input--foreground-subdued);
	font-weight: 600;
	text-align: right;
	vertical-align: middle;
	font-feature-settings: 'tnum';

	&.warning {
		color: var(--theme--warning);
	}
	&.danger {
		color: var(--theme--danger);
	}
}

.image-preview,
.media-preview {
	width: 100%;
	height: var(--input-height-tall);
	margin-bottom: 24px;
	object-fit: cover;
	border-radius: var(--theme--border-radius);
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>
