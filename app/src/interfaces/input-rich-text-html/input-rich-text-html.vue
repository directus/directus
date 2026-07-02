<script setup lang="ts">
import type { SettingsStorageAssetPreset } from '@directus/types';
import { type Editor, EditorContent, useEditor } from '@tiptap/vue-3';
import { onKeyStroke } from '@vueuse/core';
import { computed, ref, type Ref, toRefs, watch } from 'vue';
import { useImage } from './composables/use-image';
import { useLink } from './composables/use-link';
import { useMedia } from './composables/use-media';
import ImageDrawer from './drawers/image-drawer.vue';
import LinkDrawer from './drawers/link-drawer.vue';
import MediaDrawer from './drawers/media-drawer.vue';
import { editorExtensions } from './extensions';
import { LinkShortcut } from './extensions/link-shortcut';
import TableBubbleMenu from './toolbar/menus/table-bubble-menu.vue';
import Toolbar from './toolbar/toolbar.vue';
import toolbarDefault from './toolbar-default';
import { useInjectFocusTrapManager } from '@/composables/use-focus-trap-manager';
import { parseGlobalMimeTypeAllowList } from '@/composables/use-mime-type-filter';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';

const props = withDefaults(
	defineProps<{
		value: string | null;
		toolbar?: string[];
		font?: 'sans-serif' | 'serif' | 'monospace';
		disabled?: boolean;
		nonEditable?: boolean;
		imageToken?: string;
		folder?: string;
	}>(),
	{
		toolbar: () => toolbarDefault,
		font: 'sans-serif',
	},
);

const emit = defineEmits<{ input: [value: string | null] }>();

const { imageToken, folder } = toRefs(props);

// base content font, driven by the `font` option; theme tokens use `sans` (not `sans-serif`)
const fontFamily = computed(() => {
	const token = props.font === 'sans-serif' ? 'sans' : props.font;
	return `var(--theme--fonts--${token}--font-family)`;
});

// both states are read-only; `nonEditable` keeps the normal look, `disabled` dims (see styles)
const isEditable = computed(() => !props.disabled && !props.nonEditable);

// Sync an external value into the editor without polluting undo history or emitting an update.
// `addToHistory: false` keeps these programmatic syncs out of the undo stack, otherwise the
// first value load registers a phantom "empty → content" step and undo wipes the content.
// The initial load also routes through here (not the constructor's `content`) so StarterKit's
// TrailingNode normalization — appending a trailing paragraph after content that ends in a
// non-paragraph block — runs now, inside this suppressed transaction. Set at construction it
// would instead be deferred to the user's first click, emitting a phantom edit that marks the
// field dirty (only for non-Tiptap-authored HTML, e.g. legacy TinyMCE content). See dirty-on-click.test.ts.
function syncValue(instance: Editor, value: string | null) {
	instance
		.chain()
		.setMeta('addToHistory', false)
		.setContent(value ?? '', { emitUpdate: false })
		.run();
}

const editor = useEditor({
	// LinkShortcut lives here, not in the shared set, so its Mod-K handler can call this instance's opener
	extensions: [...editorExtensions, LinkShortcut.configure({ onTrigger: () => openLinkDrawer() })],
	content: '',
	editable: isEditable.value,
	editorProps: {
		// double-click an image or media node to edit it in the drawer; single click just selects
		handleDoubleClickOn: (_view, _pos, node, nodePos) => {
			if (node.type.name === 'image') {
				editor.value?.commands.setNodeSelection(nodePos);
				openImageDrawer();
				return true;
			}

			if (node.type.name === 'media') {
				editor.value?.commands.setNodeSelection(nodePos);
				openMediaDrawer();
				return true;
			}

			return false;
		},
		// Cmd/Ctrl+click a link opens it in a new tab (matches the legacy TinyMCE editor).
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
		emit('input', editor.isEmpty ? null : editor.getHTML());
	},
});

const settingsStore = useSettingsStore();
const { info } = useServerStore();

const allowedMimeTypes = computed(() => parseGlobalMimeTypeAllowList(info.files?.mimeTypeAllowList)?.join(','));

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
	activeTab,
	openMediaDrawer,
	closeMediaDrawer,
	onMediaSelect,
	saveMedia,
} = useMedia(editor as Ref<Editor>, imageToken);

// First drawer in the new editor: pause the surrounding view's focus trap while it's open so the
// drawer's inputs are reachable; resume on close. Reused by the link/media/source drawers later.
const { pauseFocusTrap, unpauseFocusTrap } = useInjectFocusTrapManager();

watch([imageDrawerOpen, linkDrawerOpen, mediaDrawerOpen], ([image, link, media]) =>
	image || link || media ? pauseFocusTrap() : unpauseFocusTrap(),
);

// `editable` is only read at init, so keep it in sync when the prop flips
watch(isEditable, (editable) => editor.value?.setEditable(editable));

// external value changes (async load, revert, version switch) — guard against echo loops
watch(
	() => props.value,
	(value) => {
		if (!editor.value) return;
		if (editor.value.getHTML() === value) return;
		syncValue(editor.value, value);
	},
);

const fullscreen = ref(false);

// Container-class toggle revealing dashed guides on borderless tables — same pattern as `fullscreen`.
const visualaid = ref(false);

onKeyStroke('Escape', () => {
	if (fullscreen.value) fullscreen.value = false;
});
</script>

<template>
	<div
		class="wysiwyg"
		:class="{ disabled, 'non-editable': nonEditable, fullscreen, visualaid }"
		:style="{ '--editor-font-family': fontFamily }"
	>
		<Toolbar
			v-if="!nonEditable"
			:editor="editor"
			:toolbar="toolbar"
			:font="font"
			:disabled="disabled"
			:fullscreen="fullscreen"
			:visualaid="visualaid"
			@toggle-fullscreen="fullscreen = !fullscreen"
			@toggle-visualaid="visualaid = !visualaid"
			@open-image="openImageDrawer"
			@open-media="openMediaDrawer"
			@open-link="openLinkDrawer"
		/>
		<EditorContent class="editor-content" :editor="editor" />

		<TableBubbleMenu v-if="!nonEditable" :editor="editor" />

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
			:folder="folder"
			:allowed-mime-types="allowedMimeTypes"
			@select="onMediaSelect"
			@save="saveMedia"
			@cancel="closeMediaDrawer"
		/>
	</div>
</template>

<style lang="scss" scoped>
.wysiwyg {
	--v-button-background-color: transparent;
	--v-button-color: var(--theme--form--field--input--foreground);
	--v-button-background-color-hover: var(--theme--form--field--input--border-color);
	--v-button-color-hover: var(--theme--form--field--input--foreground);

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

/* Content styles, scoped to the ProseMirror container so they neither leak into the app nor inherit app styles.
   Ported from the former iframe `get-editor-styles.ts`, using live theme tokens instead of snapshotted values. */
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

	:is(img, hr).ProseMirror-selectednode {
		outline: 2px solid var(--theme--primary);
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
}

/* `visualaid` toggle: dashed guides so borderless tables stay visible while editing. */
.wysiwyg.visualaid :deep(.ProseMirror) table :is(th, td) {
	border: 0.0625rem dashed var(--theme--primary);
}
</style>
