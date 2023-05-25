<template>
	<div :id="field" class="wysiwyg" :class="{ disabled }">
		<editor
			ref="editorElement"
			v-model="internalValue"
			:init="editorOptions"
			:disabled="disabled"
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
							<v-input v-model="linkSelection.url" :placeholder="t('url_placeholder')"></v-input>
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
					:line-wrapping="true"
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
						<div v-if="storageAssetTransform !== 'none' && storageAssetPresets.length > 0" class="field half">
							<div class="type-label">{{ t('transformation_preset_key') }}</div>
							<v-select
								v-model="imageSelection.transformationKey"
								:items="storageAssetPresets.map((preset) => ({ text: preset.key, value: preset.key }))"
								:show-deselect="true"
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

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';
import { percentage } from '@/utils/percentage';
import { SettingsStorageAssetPreset } from '@directus/types';
import Editor from '@tinymce/tinymce-vue';
import { ComponentPublicInstance, computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import getEditorStyles from './get-editor-styles';
import useImage from './useImage';
import useLink from './useLink';
import useMedia from './useMedia';
import useSourceCode from './useSourceCode';

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
		disabled: true,
	}
);

const emit = defineEmits(['input']);

const { t } = useI18n();
const editorRef = ref<any | null>(null);
const editorElement = ref<ComponentPublicInstance | null>(null);
const { imageToken } = toRefs(props);
const settingsStore = useSettingsStore();

let storageAssetTransform = ref('all');
let storageAssetPresets = ref<SettingsStorageAssetPreset[]>([]);

if (settingsStore.settings?.storage_asset_transform) {
	storageAssetTransform.value = settingsStore.settings.storage_asset_transform;
	storageAssetPresets.value = settingsStore.settings.storage_asset_presets ?? [];
}

let count = ref(0);

const { imageDrawerOpen, imageSelection, closeImageDrawer, onImageSelect, saveImage, imageButton } = useImage(
	editorRef,
	imageToken!,
	{
		storageAssetTransform,
		storageAssetPresets,
	}
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

const { linkButton, linkDrawerOpen, closeLinkDrawer, saveLink, linkSelection, linkNode } = useLink(editorRef);

const { codeDrawerOpen, code, closeCodeDrawer, saveCode, sourceCodeButton } = useSourceCode(editorRef);

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
	}
);

const editorOptions = computed(() => {
	let styleFormats = null;

	if (Array.isArray(props.customFormats) && props.customFormats.length > 0) {
		styleFormats = props.customFormats;
	}

	let toolbarString = (props.toolbar ?? [])
		.map((t) =>
			t
				.replace(/^link$/g, 'customLink')
				.replace(/^media$/g, 'customMedia')
				.replace(/^code$/g, 'customCode')
				.replace(/^image$/g, 'customImage')
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
		toolbar: toolbarString,
		style_formats: styleFormats,
		file_picker_types: 'customImage customMedia image media',
		link_default_protocol: 'https',
		browser_spellcheck: true,
		directionality: props.direction,
		paste_data_images: false,
		setup,
		...(props.tinymceOverrides || {}),
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

	editor.ui.registry.addToggleButton('customImage', imageButton);
	editor.ui.registry.addToggleButton('customMedia', mediaButton);
	editor.ui.registry.addToggleButton('customLink', linkButton);
	editor.ui.registry.addButton('customCode', sourceCodeButton);

	editor.on('init', function () {
		editor.shortcuts.remove('meta+k');

		editor.addShortcut('meta+k', 'Insert Link', () => {
			editor.ui.registry.getAll().buttons.customlink.onAction();
		});

		setCount();
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
</script>

<style lang="scss">
@import 'tinymce/skins/ui/oxide/skin.css';
@import './tinymce-overrides.css';
</style>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.body {
	padding: 20px;
}

.grid {
	@include form-grid;
}

.remaining {
	position: absolute;
	right: 10px;
	bottom: 5px;
	color: var(--foreground-subdued);
	font-weight: 600;
	text-align: right;
	vertical-align: middle;
	font-feature-settings: 'tnum';
}

.warning {
	color: var(--warning);
}

.danger {
	color: var(--danger);
}

.image-preview,
.media-preview {
	width: 100%;
	height: var(--input-height-tall);
	margin-bottom: 24px;
	object-fit: cover;
	border-radius: var(--border-radius);
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>
