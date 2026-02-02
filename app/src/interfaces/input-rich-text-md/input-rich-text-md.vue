<script setup lang="ts">
import { markdown } from '@codemirror/lang-markdown';
import { Annotation, Compartment, EditorState } from '@codemirror/state';
import { EditorView, placeholder as placeholderExtension } from '@codemirror/view';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Alteration, applyEdit, CustomSyntax } from './edits';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VItemGroup from '@/components/v-item-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemHint from '@/components/v-list-item-hint.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import VUpload from '@/components/v-upload.vue';
import { useShortcut } from '@/composables/use-shortcut';
import { useWindowSize } from '@/composables/use-window-size';
import { getAssetUrl } from '@/utils/get-asset-url';
import { percentage } from '@/utils/percentage';
import { translateShortcut } from '@/utils/translate-shortcut';

const setValueAnnotation = Annotation.define<boolean>();

const props = withDefaults(
	defineProps<{
		value: string | null;
		disabled?: boolean;
		nonEditable?: boolean;
		placeholder?: string;
		editorFont?: 'sans-serif' | 'serif' | 'monospace';
		previewFont?: 'sans-serif' | 'serif' | 'monospace';
		defaultView?: 'editor' | 'preview';
		toolbar?: string[];
		customSyntax?: CustomSyntax[];
		imageToken?: string;
		softLength?: number;
		folder?: string;
		direction?: string;
	}>(),
	{
		editorFont: 'sans-serif',
		previewFont: 'sans-serif',
		defaultView: 'editor',
		nonEditable: false,
		toolbar: () => [
			'heading',
			'bold',
			'italic',
			'strikethrough',
			'bullist',
			'numlist',
			'blockquote',
			'code',
			'link',
			'table',
			'image',
			'link',
			'empty',
		],
		customSyntax: () => [],
	},
);

const emit = defineEmits(['input']);

const { width } = useWindowSize();

const markdownInterface = ref<HTMLElement>();
const codemirrorEl = ref<HTMLElement>();
let editorView: EditorView | null = null;
let previousContent: string | null = null;

const readOnlyCompartment = new Compartment();
const editableCompartment = new Compartment();
const directionCompartment = new Compartment();
const placeholderCompartment = new Compartment();

const view = ref(props.defaultView);

const imageDialogOpen = ref(false);

const count = ref(0);

const readOnly = computed(() => {
	if (width.value < 600) {
		return props.disabled;
	} else {
		return props.disabled;
	}
});

onMounted(async () => {
	if (codemirrorEl.value) {
		const updateListener = EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				const content = update.state.doc.toString();

				// prevent duplicate emits with same content
				if (content === previousContent) return;
				previousContent = content;

				if (update.transactions.some((tr) => tr.annotation(setValueAnnotation))) {
					return;
				}

				emit('input', content);
			}
		});

		const state = EditorState.create({
			doc: props.value || '',
			extensions: [
				markdown(),
				EditorView.lineWrapping,
				readOnlyCompartment.of(EditorState.readOnly.of(readOnly.value)),
				editableCompartment.of(EditorView.editable.of(!readOnly.value)),
				directionCompartment.of(
					EditorView.contentAttributes.of({
						dir: props.direction === 'rtl' ? 'rtl' : 'ltr',
					}),
				),
				placeholderCompartment.of(props.placeholder ? placeholderExtension(props.placeholder) : []),
				EditorView.contentAttributes.of({ spellcheck: 'true' }),
				EditorView.theme({
					'&': {
						fontFamily: editFamily.value,
					},
					'.cm-content': {
						padding: '20px',
					},
					'.cm-focused': {
						outline: 'none',
					},
				}),
				updateListener,
			],
		});

		editorView = new EditorView({
			state,
			parent: codemirrorEl.value,
		});
	}

	if (markdownInterface.value) {
		const previewBox = markdownInterface.value.getElementsByClassName('preview-box')[0] as HTMLDivElement;

		const observer = new MutationObserver(() => {
			count.value = previewBox?.textContent?.replace('\n', '')?.length ?? 0;
		});

		const config = { characterData: true, childList: true, subtree: true };

		observer.observe(previewBox, config);
	}
});

onBeforeUnmount(() => {
	if (editorView) {
		editorView.destroy();
		editorView = null;
	}
});

watch(
	() => props.value,
	(newValue) => {
		if (!editorView) return;

		const existingValue = editorView.state.doc.toString();

		if (existingValue !== newValue) {
			editorView.dispatch({
				changes: {
					from: 0,
					to: editorView.state.doc.length,
					insert: newValue ?? '',
				},
				annotations: [setValueAnnotation.of(true)],
			});
		}
	},
);

watch(
	() => props.disabled,
	() => {
		if (!editorView) return;

		editorView.dispatch({
			effects: [
				readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly.value)),
				editableCompartment.reconfigure(EditorView.editable.of(!readOnly.value)),
			],
		});
	},
	{ immediate: true },
);

watch(
	() => props.direction,
	(direction) => {
		if (!editorView) return;

		editorView.dispatch({
			effects: [
				directionCompartment.reconfigure(
					EditorView.contentAttributes.of({
						dir: direction === 'rtl' ? 'rtl' : 'ltr',
					}),
				),
			],
		});
	},
);

watch(
	() => props.placeholder,
	(ph) => {
		if (!editorView) return;

		editorView.dispatch({
			effects: [placeholderCompartment.reconfigure(ph ? placeholderExtension(ph) : [])],
		});
	},
);

const editFamily = computed(() => {
	return `var(--family-${props.editorFont})`;
});

const previewFamily = computed(() => {
	return `var(--family-${props.previewFont})`;
});

const markdownString = computed(() => {
	return props.value || '';
});

const table = reactive({
	rows: 4,
	columns: 4,
});

const percRemaining = computed(() => percentage(count.value, props.softLength) ?? 100);
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

function onImageUpload(image: any) {
	if (!editorView) return;

	let url = getAssetUrl(image.id);

	if (props.imageToken) {
		url += '?access_token=' + props.imageToken;
	}

	const selection = editorView.state.selection.main;
	const selectedText = editorView.state.sliceDoc(selection.from, selection.to);

	editorView.dispatch({
		changes: {
			from: selection.from,
			to: selection.to,
			insert: `![${selectedText}](${url})`,
		},
		selection: {
			anchor: selection.from + selectedText.length + 4 + url.length + 1,
		},
	});

	editorView.focus();
	imageDialogOpen.value = false;
}

function edit(type: Alteration, options?: Record<string, any>) {
	if (editorView) {
		applyEdit(editorView, type, options);
	}
}
</script>

<template>
	<div
		ref="markdownInterface"
		class="interface-input-rich-text-md"
		:class="[view, { disabled, 'non-editable': nonEditable }]"
	>
		<div class="toolbar">
			<template v-if="!nonEditable && view === 'editor'">
				<VMenu v-if="toolbar?.includes('heading')" show-arrow placement="bottom-start">
					<template #activator="{ toggle }">
						<VButton v-tooltip="$t('wysiwyg_options.heading')" :disabled="disabled" small icon @click="toggle">
							<VIcon name="format_size" />
						</VButton>
					</template>
					<VList>
						<VListItem v-for="n in 6" :key="n" clickable @click="edit('heading', { level: n })">
							<VListItemContent><VTextOverflow :text="$t(`wysiwyg_options.h${n}`)" /></VListItemContent>
							<VListItemHint>{{ translateShortcut(['meta', 'alt']) }} {{ n }}</VListItemHint>
						</VListItem>
					</VList>
				</VMenu>

				<VButton
					v-if="toolbar?.includes('bold')"
					v-tooltip="$t('wysiwyg_options.bold') + ' - ' + translateShortcut(['meta', 'b'])"
					:disabled="disabled"
					small
					icon
					@click="edit('bold')"
				>
					<VIcon name="format_bold" />
				</VButton>
				<VButton
					v-if="toolbar?.includes('italic')"
					v-tooltip="$t('wysiwyg_options.italic') + ' - ' + translateShortcut(['meta', 'i'])"
					:disabled="disabled"
					small
					icon
					@click="edit('italic')"
				>
					<VIcon name="format_italic" />
				</VButton>
				<VButton
					v-if="toolbar?.includes('strikethrough')"
					v-tooltip="$t('wysiwyg_options.strikethrough') + ' - ' + translateShortcut(['meta', 'alt', 'd'])"
					:disabled="disabled"
					small
					icon
					@click="edit('strikethrough')"
				>
					<VIcon name="format_strikethrough" />
				</VButton>
				<VButton
					v-if="toolbar?.includes('bullist')"
					v-tooltip="$t('wysiwyg_options.bullist')"
					:disabled="disabled"
					small
					icon
					@click="edit('listBulleted')"
				>
					<VIcon name="format_list_bulleted" />
				</VButton>
				<VButton
					v-if="toolbar?.includes('numlist')"
					v-tooltip="$t('wysiwyg_options.numlist')"
					:disabled="disabled"
					small
					icon
					@click="edit('listNumbered')"
				>
					<VIcon name="format_list_numbered" />
				</VButton>
				<VButton
					v-if="toolbar?.includes('blockquote')"
					v-tooltip="$t('wysiwyg_options.blockquote') + ' - ' + translateShortcut(['meta', 'alt', 'q'])"
					:disabled="disabled"
					small
					icon
					@click="edit('blockquote')"
				>
					<VIcon name="format_quote" />
				</VButton>
				<VButton
					v-if="toolbar?.includes('code')"
					v-tooltip="$t('wysiwyg_options.codeblock') + ' - ' + translateShortcut(['meta', 'alt', 'c'])"
					:disabled="disabled"
					small
					icon
					@click="edit('code')"
				>
					<VIcon name="code" />
				</VButton>
				<VButton
					v-if="toolbar?.includes('link')"
					v-tooltip="$t('wysiwyg_options.link') + ' - ' + translateShortcut(['meta', 'k'])"
					:disabled="disabled"
					small
					icon
					@click="edit('link')"
				>
					<VIcon name="insert_link" />
				</VButton>

				<VMenu v-if="toolbar?.includes('table')" show-arrow :close-on-content-click="false">
					<template #activator="{ toggle }">
						<VButton v-tooltip="$t('wysiwyg_options.table')" :disabled="disabled" small icon @click="toggle">
							<VIcon name="table_chart" />
						</VButton>
					</template>

					<template #default="{ deactivate }">
						<div class="table-options">
							<div class="field half">
								<p class="type-label">{{ $t('rows') }}</p>
								<VInput v-model="table.rows" :min="1" type="number" />
							</div>
							<div class="field half">
								<p class="type-label">{{ $t('columns') }}</p>
								<VInput v-model="table.columns" :min="1" type="number" />
							</div>
							<div class="field full">
								<VButton
									full-width
									@click="
										() => {
											edit('table', table);
											deactivate();
										}
									"
								>
									Create
								</VButton>
							</div>
						</div>
					</template>
				</VMenu>

				<VButton
					v-if="toolbar?.includes('image')"
					v-tooltip="$t('wysiwyg_options.image')"
					:disabled="disabled"
					small
					icon
					@click="imageDialogOpen = true"
				>
					<VIcon name="insert_photo" />
				</VButton>

				<VButton
					v-for="custom in customSyntax"
					:key="custom.name"
					v-tooltip="custom.name"
					:disabled="disabled"
					small
					icon
					@click="edit('custom', custom)"
				>
					<VIcon :name="custom.icon" />
				</VButton>
			</template>

			<div class="spacer"></div>

			<VItemGroup
				:model-value="[view]"
				class="view"
				mandatory
				rounded
				@update:model-value="([value]: ['editor' | 'preview']) => (view = value)"
			>
				<VButton x-small value="editor" :disabled="disabled && !nonEditable" :class="[{ active: view !== 'preview' }]">
					{{ $t('interfaces.input-rich-text-md.edit') }}
				</VButton>
				<VButton x-small value="preview" :disabled="disabled && !nonEditable" :class="[{ active: view === 'preview' }]">
					{{ $t('interfaces.input-rich-text-md.preview') }}
				</VButton>
			</VItemGroup>
		</div>

		<div ref="codemirrorEl" class="codemirror-container"></div>
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
		<div
			v-md="markdownString"
			class="preview-box"
			:style="{ display: view === 'preview' ? 'block' : 'none', direction: direction === 'rtl' ? direction : 'ltr' }"
		></div>

		<VDialog
			:model-value="imageDialogOpen"
			keep-behind
			@esc="imageDialogOpen = false"
			@update:model-value="imageDialogOpen = false"
		>
			<VCard>
				<VCardTitle>{{ $t('upload_from_device') }}</VCardTitle>
				<VCardText>
					<VUpload from-url from-library :folder="folder" @input="onImageUpload" />
				</VCardText>
				<VCardActions>
					<VButton secondary @click="imageDialogOpen = false">{{ $t('cancel') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.interface-input-rich-text-md {
	--v-button-background-color: transparent;
	--v-button-color: var(--theme--form--field--input--foreground);
	--v-button-background-color-hover: var(--theme--form--field--input--border-color);
	--v-button-color-hover: var(--theme--form--field--input--foreground);
	--editor-min-height: var(--input-height-lg);
	--editor-toolbar-height: 40px;
	--editor-body-min-height: calc(var(--editor-min-height) - var(--editor-toolbar-height));

	min-block-size: var(--editor-min-height);
	overflow: hidden;
	font-family: var(--theme--fonts--sans--font-family);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--form--field--input--box-shadow);
	transition-duration: var(--fast);
	transition-timing-function: var(--transition);
	transition-property: box-shadow, border-color;
}

.interface-input-rich-text-md .codemirror-container :deep(.cm-scroller) {
	max-block-size: min(1000px, 80vh);
}

.interface-input-rich-text-md.disabled:not(.non-editable) {
	background-color: var(--theme--form--field--input--background-subdued);

	* {
		color: var(--theme--form--field--input--foreground-subdued) !important;
	}
}

.interface-input-rich-text-md:not(.disabled):hover {
	border-color: var(--theme--form--field--input--border-color-hover);
	box-shadow: var(--theme--form--field--input--box-shadow-hover);
}

.interface-input-rich-text-md:not(.disabled):focus-within {
	border-color: var(--theme--form--field--input--border-color-focus);
	box-shadow: var(--theme--form--field--input--box-shadow-focus);
}

textarea {
	display: none;
}

.preview-box {
	display: none;
	padding: 20px 24px;
	font-family: v-bind(previewFamily), serif;

	:deep() {
		@include mixins.markdown;
	}
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

.interface-input-rich-text-md.disabled:not(.non-editable) .preview-box {
	color: var(--theme--form--field--input--foreground-subdued);
}

.interface-input-rich-text-md .codemirror-container :deep(.cm-editor) {
	border: none;
	border-radius: 0;
	box-shadow: none;
}

.interface-input-rich-text-md .codemirror-container :deep(.cm-editor .cm-scroller) {
	font-family: v-bind(editFamily), sans-serif;
}

.interface-input-rich-text-md.preview .codemirror-container {
	display: none;
}

.toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	min-block-size: var(--editor-toolbar-height);
	padding: 4px;
	background-color: var(--theme--form--field--input--background-subdued);
	border-block-end: var(--theme--border-width) solid var(--theme--form--field--input--border-color);

	.v-button {
		--focus-ring-offset: var(--focus-ring-offset-invert);

		+ .v-button {
			margin-inline-start: 2px;
		}
	}

	.spacer {
		flex-grow: 1;
	}

	.view {
		--v-button-background-color: var(--theme--border-color-subdued);
		--v-button-color: var(--theme--form--field--input--foreground-subdued);
		--v-button-background-color-hover: var(--theme--form--field--input--border-color);
		--v-button-color-hover: var(--theme--form--field--input--foreground);
		--v-button-background-color-active: var(--theme--form--field--input--border-color);
		--v-button-color-active: var(--theme--form--field--input--foreground);
	}
}

.table-options {
	--theme--form--row-gap: 12px;
	--theme--form--column-gap: 12px;
	min-inline-size: 280px;
	padding: 12px;
	@include mixins.form-grid;

	.v-input {
		min-inline-size: 100px;
	}
}
</style>
