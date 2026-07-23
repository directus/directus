<script setup lang="ts">
import type { SettingsStorageAssetPreset } from '@directus/types';
import { type Editor, EditorContent, useEditor } from '@tiptap/vue-3';
import { onKeyStroke } from '@vueuse/core';
import { computed, nextTick, ref, type Ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImage } from './composables/use-image';
import { useLink } from './composables/use-link';
import { useMedia } from './composables/use-media';
import { useNormalizationWarning } from './composables/use-normalization-warning';
import { useSourceCode } from './composables/use-source-code';
import ImageDrawer from './drawers/image-drawer.vue';
import LinkDrawer from './drawers/link-drawer.vue';
import MediaDrawer from './drawers/media-drawer.vue';
import NormalizationWarningDialog from './drawers/normalization-warning-dialog.vue';
import SourceCodeDrawer from './drawers/source-code-drawer.vue';
import { editorExtensions } from './extensions';
import { ComparisonDiff } from './extensions/comparison-diff';
import { buildCustomFormats } from './extensions/custom-formats';
import { LinkShortcut } from './extensions/link-shortcut';
import { decodePageBreaks, encodePageBreaks } from './extensions/page-break';
import TableBubbleMenu from './toolbar/menus/table-bubble-menu.vue';
import Toolbar from './toolbar/toolbar.vue';
import toolbarDefault from './toolbar-default';
import VNotice from '@/components/v-notice.vue';
import { useInjectFocusTrapManager } from '@/composables/use-focus-trap-manager';
import { parseGlobalMimeTypeAllowList, useMimeTypeFilter } from '@/composables/use-mime-type-filter';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { getDirectusUrlWithUtm } from '@/utils/directus-url';
import { percentage } from '@/utils/percentage';

const props = withDefaults(
	defineProps<{
		value: string | null;
		toolbar?: string[];
		font?: 'sans-serif' | 'serif' | 'monospace';
		disabled?: boolean;
		nonEditable?: boolean;
		imageToken?: string;
		folder?: string;
		/** Legacy TinyMCE `customFormats` option (array or JSON string); see extensions/custom-formats.ts. */
		customFormats?: unknown;
		softLength?: number;
		direction?: string;
		// comparison view (content versioning / revision diffs): value arrives pre-marked with
		// comparison-diff spans; side switches flow in as value changes
		comparisonMode?: boolean;
	}>(),
	{
		toolbar: () => toolbarDefault,
		font: 'sans-serif',
	},
);

const emit = defineEmits<{ input: [value: string | null] }>();

const { t } = useI18n();

const { imageToken, folder, value } = toRefs(props);

// built once at init: `customFormats` is design-time config, not reactive
const { extensions: customFormatExtensions, formats: customFormatList } = buildCustomFormats(props.customFormats);

const pageBreakLabel = computed(() => `"${t('wysiwyg_options.pagebreak')}"`);

// base content font, driven by the `font` option; theme tokens use `sans` (not `sans-serif`)
const fontFamily = computed(() => {
	const token = props.font === 'sans-serif' ? 'sans' : props.font;
	return `var(--theme--fonts--${token}--font-family)`;
});

const {
	normalizationLocked,
	normalizationWarningOpen,
	normalizationWarningDiff,
	checkValue,
	onLockedClick,
	confirmNormalizationWarning,
	cancelNormalizationWarning,
} = useNormalizationWarning(value, customFormatExtensions);

// skipped for display-only modes; comparison values carry diff spans the base schema would flag as loss
if (!props.comparisonMode && !props.nonEditable) checkValue();

// read-only states: `nonEditable`/`comparisonMode` keep the normal look, `disabled` dims (see styles),
// `normalizationLocked` guards lossy stored HTML until the warning dialog is confirmed
const isEditable = computed(
	() => !props.disabled && !props.nonEditable && !props.comparisonMode && !normalizationLocked.value,
);

const editorDir = computed(() => (props.direction === 'rtl' ? 'rtl' : 'ltr'));

// `addToHistory: false` keeps programmatic syncs out of the undo stack (undo would wipe the content).
// The initial load routes through here (not the constructor) so TrailingNode normalization runs inside
// this suppressed transaction instead of dirtying the field on first click (see dirty-on-click.test.ts).
function syncValue(instance: Editor, value: string | null) {
	instance
		.chain()
		.setMeta('addToHistory', false)
		.setContent(decodePageBreaks(value ?? ''), { emitUpdate: false })
		.run();

	// `emitUpdate: false` skips `onUpdate`, so refresh the soft-length count here too
	updateCount(instance);
}

const count = ref(0);

function updateCount(instance: Editor) {
	count.value = instance.storage.characterCount?.characters() ?? 0;
}

const percRemaining = computed(() => percentage(count.value, props.softLength) ?? 100);

const editor = useEditor({
	// LinkShortcut lives here, not in the shared set, so its Mod-K handler can call this instance's opener.
	// ComparisonDiff only joins the schema in comparison mode — the view mounts fresh per comparison,
	// so deciding at construction is safe, and normal editing keeps stripping diff spans.
	extensions: [
		...editorExtensions,
		...customFormatExtensions,
		LinkShortcut.configure({ onTrigger: () => openLinkDrawer() }),
		...(props.comparisonMode ? [ComparisonDiff] : []),
	],
	content: '',
	editable: isEditable.value,
	editorProps: {
		// media nodes handle dblclick themselves in their node view
		handleDoubleClickOn: (_view, _pos, node, nodePos) => {
			if (node.type.name === 'image') {
				editor.value?.commands.setNodeSelection(nodePos);
				openImageDrawer();
				return true;
			}

			return false;
		},
		// Cmd/Ctrl+click opens links in a new tab (parity with TinyMCE)
		handleClick: (_view, _pos, event) => {
			if (event.button !== 0 || !(event.metaKey || event.ctrlKey)) return false;
			const link = (event.target as HTMLElement | null)?.closest('a');
			if (!link?.href) return false;
			window.open(link.href, '_blank', 'noopener,noreferrer');
			return true;
		},
	},
	onCreate: ({ editor }) => {
		syncValue(editor as Editor, props.value);
		const storage = (editor as Editor).storage as Record<string, any>;
		if (storage.media) storage.media.onOpenDrawer = openMediaDrawer;
	},
	onUpdate: ({ editor }) => {
		updateCount(editor as Editor);
		emit('input', editor.isEmpty ? null : encodePageBreaks(editor.getHTML()));
	},
});

function onEditorClick() {
	if (props.disabled || props.nonEditable || props.comparisonMode) return;
	onLockedClick();
}

// raw mode edits the stored HTML as text in the code interface — emits never round-trip through
// the schema, so nothing is normalized away; the loss-free alternative the warning offers
const rawMode = ref(false);

function enterRawMode() {
	normalizationWarningOpen.value = false;
	rawMode.value = true;
}

// the unlock flips `isEditable` on the next flush, so focus has to wait for it
async function onWarningConfirm() {
	confirmNormalizationWarning();
	await nextTick();
	editor.value?.commands.focus();
}

const settingsStore = useSettingsStore();
const { info } = useServerStore();

const allowedMimeTypes = computed(() => parseGlobalMimeTypeAllowList(info.files?.mimeTypeAllowList)?.join(','));

const normalizationDocsUrl = computed(
	() =>
		getDirectusUrlWithUtm(
			'https://directus.com/docs/releases/breaking-changes/version-12',
			info.version,
			'wysiwyg_normalization_locked_learn_more_link',
		) + '#wysiwyg-editor-rebuilt-on-tiptap',
);

// without this the picker/upload accept the global (usually image) list and the pick lands as a broken <video>
const { mimeTypeFilter: mediaMimeTypeFilter, combinedAcceptString: mediaAllowedMimeTypes } = useMimeTypeFilter([
	'video/*',
	'audio/*',
]);

const storageAssetTransform = ref('all');
const storageAssetPresets = ref<SettingsStorageAssetPreset[]>([]);

if (settingsStore.settings?.storage_asset_transform) {
	storageAssetTransform.value = settingsStore.settings.storage_asset_transform;
	storageAssetPresets.value = settingsStore.settings.storage_asset_presets ?? [];
}

const { imageDrawerOpen, imageSelection, openImageDrawer, closeImageDrawer, onImageSelect, saveImage } = useImage(
	editor as Ref<Editor>,
	imageToken,
	{ storageAssetTransform, storageAssetPresets },
);

const {
	linkDrawerOpen,
	linkSelection,
	isEditingLink,
	isLinkSaveable,
	openLinkDrawer,
	closeLinkDrawer,
	saveLink,
	unlink,
} = useLink(editor as Ref<Editor>);

const {
	mediaDrawerOpen,
	mediaSelection,
	embed,
	embedInvalid,
	activeTab,
	openMediaDrawer,
	closeMediaDrawer,
	onMediaSelect,
	saveMedia,
} = useMedia(editor as Ref<Editor>, imageToken);

const {
	sourceCodeDrawerOpen,
	code,
	normalizeConfirmOpen,
	normalizeDiff,
	openSourceCodeDrawer,
	closeSourceCodeDrawer,
	saveSourceCode,
	confirmSaveSourceCode,
	cancelNormalize,
} = useSourceCode(editor as Ref<Editor>, customFormatExtensions);

// pause the surrounding view's focus trap while a drawer is open so its inputs stay reachable
const { pauseFocusTrap, unpauseFocusTrap } = useInjectFocusTrapManager();

watch([imageDrawerOpen, linkDrawerOpen, mediaDrawerOpen, sourceCodeDrawerOpen], (open) =>
	open.some(Boolean) ? pauseFocusTrap() : unpauseFocusTrap(),
);

// `editable` is only read at init, so keep it in sync when the prop flips
watch(isEditable, (editable) => editor.value?.setEditable(editable));

// external value changes (async load, revert, version switch) — guard against echo loops
watch(
	() => props.value,
	(value) => {
		// raw mode edits flow straight through the code interface, never through the editor
		if (rawMode.value) return;
		if (!editor.value) return;
		// compare the encoded (stored) form so a re-emitted page-break marker doesn't look like a change
		if (encodePageBreaks(editor.value.getHTML()) === value) return;
		syncValue(editor.value, value);
		if (!props.comparisonMode && !props.nonEditable) checkValue();
	},
);

const fullscreen = ref(false);
const visualaid = ref(false);

onKeyStroke('Escape', () => {
	if (fullscreen.value) fullscreen.value = false;
});
</script>

<template>
	<VNotice v-if="normalizationLocked && !rawMode" type="warning" multiline class="normalization-notice">
		{{ t('wysiwyg_options.normalization_locked_notice') }}
		<a :href="normalizationDocsUrl" target="_blank" rel="noopener noreferrer">
			{{ t('wysiwyg_options.normalization_locked_learn_more') }}
		</a>
	</VNotice>
	<div
		class="wysiwyg"
		:class="{ disabled, 'non-editable': nonEditable || comparisonMode, fullscreen, visualaid }"
		:style="{ '--editor-font-family': fontFamily, '--page-break-label': pageBreakLabel }"
	>
		<Toolbar
			v-if="!nonEditable && !comparisonMode && !rawMode"
			:editor="editor"
			:toolbar="toolbar"
			:font="font"
			:custom-formats="customFormatList"
			:disabled="disabled || normalizationLocked"
			:fullscreen="fullscreen"
			:visualaid="visualaid"
			@toggle-fullscreen="fullscreen = !fullscreen"
			@toggle-visualaid="visualaid = !visualaid"
			@open-image="openImageDrawer"
			@open-media="openMediaDrawer"
			@open-link="openLinkDrawer"
			@open-source-code="openSourceCodeDrawer"
		/>
		<InterfaceInputCode
			v-if="rawMode"
			:value="value"
			language="htmlmixed"
			:line-number="false"
			:disabled="disabled"
			@input="$emit('input', $event)"
		/>

		<EditorContent v-show="!rawMode" class="editor-content" :editor="editor" :dir="editorDir" @click="onEditorClick" />

		<span
			v-if="softLength && !comparisonMode && !rawMode"
			class="remaining"
			:class="{
				warning: percRemaining < 10,
				danger: percRemaining < 5,
			}"
		>
			{{ softLength - count }}
		</span>

		<TableBubbleMenu v-if="!nonEditable && !comparisonMode && !normalizationLocked" :editor="editor" />

		<ImageDrawer
			v-model="imageDrawerOpen"
			v-model:image-selection="imageSelection"
			:storage-asset-transform="storageAssetTransform"
			:storage-asset-presets="storageAssetPresets"
			:folder="folder"
			:allowed-mime-types="allowedMimeTypes"
			@select="onImageSelect"
			@save="saveImage"
			@cancel="closeImageDrawer"
		/>

		<LinkDrawer
			v-model="linkDrawerOpen"
			v-model:link-selection="linkSelection"
			:editing="isEditingLink"
			:saveable="isLinkSaveable"
			@save="saveLink"
			@unlink="unlink"
			@cancel="closeLinkDrawer"
		/>

		<MediaDrawer
			v-model="mediaDrawerOpen"
			v-model:media-selection="mediaSelection"
			v-model:embed="embed"
			v-model:active-tab="activeTab"
			:embed-invalid="embedInvalid"
			:folder="folder"
			:allowed-mime-types="mediaAllowedMimeTypes"
			:filter="mediaMimeTypeFilter"
			@select="onMediaSelect"
			@save="saveMedia"
			@cancel="closeMediaDrawer"
		/>

		<SourceCodeDrawer
			v-model="sourceCodeDrawerOpen"
			v-model:code="code"
			v-model:normalize-confirm-open="normalizeConfirmOpen"
			:normalize-diff="normalizeDiff"
			@save="saveSourceCode"
			@cancel="closeSourceCodeDrawer"
			@confirm-save="confirmSaveSourceCode"
			@cancel-normalize="cancelNormalize"
		/>

		<NormalizationWarningDialog
			v-model="normalizationWarningOpen"
			:diff="normalizationWarningDiff"
			@confirm="onWarningConfirm"
			@cancel="cancelNormalizationWarning"
			@raw="enterRawMode"
		/>
	</div>
</template>

<style lang="scss" scoped>
.wysiwyg {
	--v-button-background-color: transparent;
	--v-button-color: var(--theme--form--field--input--foreground);
	--v-button-background-color-hover: var(--theme--form--field--input--border-color);
	--v-button-color-hover: var(--theme--form--field--input--foreground);

	position: relative; // anchors the soft-length `.remaining` indicator
	background-color: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	transition: border-color var(--fast) var(--transition);

	&:not(.disabled):not(.non-editable):hover {
		border-color: var(--theme--form--field--input--border-color-hover);
	}

	&:not(.disabled):not(.non-editable):focus-within {
		outline: var(--focus-ring-width) solid var(--theme--form--field--input--focus-ring-color);
		outline-offset: var(--focus-ring-offset-invert);
	}

	// `non-editable` stays visually normal (read-only display); only `disabled` dims
	&.disabled:not(.non-editable) {
		background-color: var(--theme--form--field--input--background-subdued);

		:deep(.ProseMirror) {
			color: var(--theme--foreground-subdued);
		}
	}

	&.fullscreen {
		position: fixed;
		inset: 0;
		z-index: 490; // below drawers/dialogs (500+) so image/link drawers stay on top
		display: flex;
		flex-direction: column;
		border-radius: 0;

		.editor-content {
			flex: 1;
			min-block-size: 0;
			overflow: auto;
		}
	}
}

.normalization-notice {
	margin-block-end: 0.5rem;
}

.remaining {
	position: absolute;
	inset-inline-end: 0.5625rem;
	inset-block-end: 0.3125rem;
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

/* Content styles, scoped to the ProseMirror container so they neither leak into the app nor inherit app styles. */
.wysiwyg :deep(.ProseMirror) {
	min-block-size: var(--input-height-tall);
	padding: 1.125rem;
	outline: none;
	color: var(--theme--form--field--input--foreground);
	font-family: var(--editor-font-family);
	font-size: 0.875rem;
	line-height: 1.5714;
	font-weight: 500;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-rendering: optimizeLegibility;

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-family: var(--editor-font-family);
		color: var(--theme--form--field--input--foreground-accent);
		font-weight: 700;
		margin-block-end: 0;
	}

	:is(h1, h2, h3, h4, h5, h6) + p {
		margin-block-start: 0.5em;
	}

	h1 {
		font-size: 2rem;
		line-height: 1.2813;
		margin-block-start: 1em;
	}

	h2 {
		font-size: 1.375rem;
		line-height: 1.4091;
		margin-block-start: 1.25em;
	}

	h3 {
		font-size: 1.0625rem;
		line-height: 1.5294;
		margin-block-start: 1.25em;
	}

	h4 {
		font-size: 0.875rem;
		line-height: 1.6429;
		margin-block-start: 1.5em;
	}

	h5 {
		font-size: 0.8125rem;
		line-height: 1.6923;
		margin-block-start: 2em;
	}

	h6 {
		font-size: 0.6875rem;
		line-height: 1.8182;
		margin-block-start: 2em;
	}

	p,
	ul,
	ol {
		font-family: var(--editor-font-family);
		margin: 1.5em 0;
	}

	:is(ul, ol) :is(ul, ol) {
		margin: 0;
	}

	li,
	li > p {
		margin: 0;
	}

	a {
		color: var(--theme--primary-accent);
		text-decoration: underline;
		cursor: pointer;
	}

	b,
	strong {
		font-weight: 700;
	}

	code {
		padding: 0.125rem 0.25rem;
		font-family: var(--theme--fonts--monospace--font-family), monospace;
		background-color: var(--theme--background-normal);
		border-radius: var(--theme--border-radius);
		overflow-wrap: break-word;
	}

	pre {
		padding: 1em;
		font-family: var(--theme--fonts--monospace--font-family), monospace;
		background-color: var(--theme--background-normal);
		border-radius: var(--theme--border-radius);
		overflow: auto;

		code {
			padding: 0;
			background: none;
		}
	}

	blockquote {
		font-family: var(--editor-font-family);
		border-inline-start: 2px solid var(--theme--form--field--input--border-color);
		padding-inline-start: 1em;
		margin-inline-start: 0;
	}

	img,
	video {
		max-inline-size: 100%;
		block-size: auto;
		border-radius: var(--theme--border-radius);
	}

	iframe {
		max-inline-size: 100%;
		border-radius: var(--theme--border-radius);
	}

	:is(img, hr, .page-break).ProseMirror-selectednode {
		outline: 2px solid var(--theme--primary);
	}

	.page-break {
		position: relative;
		block-size: 0;
		border: none;
		border-block-start: 2px dashed var(--theme--form--field--input--border-color);
		margin-block: 2em;
		user-select: none;

		&::after {
			content: var(--page-break-label, 'Page Break');
			position: absolute;
			inset-block-start: -0.75em;
			inset-inline-start: 50%;
			transform: translateX(-50%);
			padding-inline: 0.5em;
			background-color: var(--theme--form--field--input--background);
			color: var(--theme--foreground-subdued);
			font-size: 0.6875rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
	}

	hr {
		background-color: var(--theme--form--field--input--border-color);
		block-size: 0.0625rem;
		border: none;
		margin-block: 2em;
	}

	// prevent table from extending beyond the editor itself
	.tableWrapper {
		overflow-x: auto;
		margin: 1.5em 0;
	}

	table {
		border-collapse: collapse;
		table-layout: fixed; // honor the resizable extension's colwidth
		inline-size: 100%;
		margin: 0; // vertical spacing lives on `.tableWrapper`
		overflow: hidden;
	}

	table :is(th, td) {
		position: relative; // anchors the resize handle
		border: 0.0625rem solid var(--theme--form--field--input--border-color);
		padding: 0.3125rem;
		vertical-align: top;
		box-sizing: border-box;
	}

	table :is(th, td) > * {
		margin-block: 0;
	}

	table th {
		font-weight: 700;
		text-align: start;
		background-color: var(--theme--background-subdued);
	}

	// tiptap adds `.selectedCell` to the active cell selection
	table .selectedCell::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--theme--primary);
		opacity: 0.1;
		pointer-events: none;
	}

	// tiptap adds `.column-resize-handle` while resizing
	.column-resize-handle {
		position: absolute;
		inset-block: 0;
		inset-inline-end: -0.125rem;
		inline-size: 0.25rem;
		background-color: var(--theme--primary);
		cursor: col-resize;
		pointer-events: none;
	}

	&.resize-cursor {
		cursor: col-resize;
	}

	figure {
		display: table;
		margin: 0.8125rem auto;
	}

	figure figcaption {
		color: var(--theme--foreground-subdued);
		display: block;
		margin-block-start: 0.1875rem;
		text-align: center;
	}

	// content versioning / revision diff highlights (comparison mode)
	.comparison-diff--added {
		color: var(--theme--success);
		background-color: var(--theme--success-background);
		padding: 0.125rem;
		border-radius: var(--theme--border-radius);
	}

	.comparison-diff--removed {
		color: var(--theme--danger);
		background-color: var(--theme--danger-background);
		padding: 0.125rem;
		border-radius: var(--theme--border-radius);
	}
}

/* `visualaid` toggle: dashed guides so borderless tables stay visible while editing. */
.wysiwyg.visualaid :deep(.ProseMirror) table :is(th, td) {
	border: 0.0625rem dashed var(--theme--primary);
}
</style>
