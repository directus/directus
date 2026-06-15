<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { onKeyStroke } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import Toolbar from './toolbar/toolbar.vue';
import toolbarDefault from './toolbar-default';

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

// base content font, driven by the `font` option; theme tokens use `sans` (not `sans-serif`)
const fontFamily = computed(() => {
	const token = props.font === 'sans-serif' ? 'sans' : props.font;
	return `var(--theme--fonts--${token}--font-family)`;
});

// both states are read-only; `nonEditable` keeps the normal look, `disabled` dims (see styles)
const isEditable = computed(() => !props.disabled && !props.nonEditable);

const editor = useEditor({
	extensions: [StarterKit],
	content: props.value ?? '',
	editable: isEditable.value,
	onUpdate: ({ editor }) => {
		emit('input', editor.isEmpty ? null : editor.getHTML());
	},
});

// `editable` is only read at init, so keep it in sync when the prop flips
watch(isEditable, (editable) => editor.value?.setEditable(editable));

// external value changes (revert, version switch) — guard against echo loops
watch(
	() => props.value,
	(value) => {
		if (!editor.value) return;
		if (editor.value.getHTML() === value) return;
		editor.value.commands.setContent(value ?? '', { emitUpdate: false });
	},
);

const fullscreen = ref(false);

onKeyStroke('Escape', () => {
	if (fullscreen.value) fullscreen.value = false;
});
</script>

<template>
	<div
		class="wysiwyg"
		:class="{ disabled, 'non-editable': nonEditable, fullscreen }"
		:style="{ '--editor-font-family': fontFamily }"
	>
		<Toolbar
			v-if="!nonEditable"
			:editor="editor"
			:toolbar="toolbar"
			:disabled="disabled"
			:fullscreen="fullscreen"
			@toggle-fullscreen="fullscreen = !fullscreen"
		/>
		<EditorContent class="editor-content" :editor="editor" />
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.grid {
	@include mixins.form-grid;
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding);
}

.image-preview {
	inline-size: 100%;
	block-size: var(--input-height-md);
	margin-block-end: 1.375rem;
	object-fit: cover;
	border-radius: var(--theme--border-radius);
}

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

	table {
		border-collapse: collapse;
	}

	table :is(th, td) {
		border: 1px solid var(--theme--form--field--input--border-color);
		padding: 0.3125rem;
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
</style>
