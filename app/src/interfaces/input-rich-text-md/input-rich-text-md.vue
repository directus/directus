<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';

import CodeMirror from 'codemirror';
import 'codemirror/addon/display/placeholder.js';
import 'codemirror/mode/markdown/markdown';

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
import { Alteration, CustomSyntax, applyEdit } from './edits';

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
const codemirrorEl = ref<HTMLTextAreaElement>();
let codemirror: CodeMirror.Editor | null = null;
let previousContent: string | null = null;

const view = ref(props.defaultView);

const imageDialogOpen = ref(false);

const count = ref(0);

const readOnly = computed(() => {
	if (width.value < 600) {
		// mobile requires 'nocursor' to avoid bringing up the keyboard
		return props.disabled ? 'nocursor' : false;
	} else {
		// desktop cannot use 'nocursor' as it prevents copy/paste
		return props.disabled;
	}
});

onMounted(async () => {
	if (codemirrorEl.value) {
		codemirror = CodeMirror(codemirrorEl.value, {
			mode: 'markdown',
			configureMouse: () => ({ addNew: false }),
			lineWrapping: true,
			readOnly: readOnly.value,
			direction: props.direction === 'rtl' ? props.direction : 'ltr',
			cursorBlinkRate: props.disabled ? -1 : 530,
			placeholder: props.placeholder,
			value: props.value || '',
			spellcheck: true,
			inputStyle: 'contenteditable',
		});

		codemirror.on('change', (cm, { origin }) => {
			const content = cm.getValue();

			// prevent duplicate emits with same content
			if (content === previousContent) return;
			previousContent = content;

			if (origin === 'setValue') return;

			emit('input', content);
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

watch(
	() => props.value,
	(newValue) => {
		if (!codemirror) return;

		const existingValue = codemirror.getValue();

		if (existingValue !== newValue) {
			codemirror.setValue('');
			codemirror.clearHistory();
			codemirror.setValue(newValue ?? '');
			codemirror.refresh();
		}
	},
);

watch(
	() => props.disabled,
	(disabled) => {
		codemirror?.setOption('readOnly', readOnly.value);
		codemirror?.setOption('cursorBlinkRate', disabled ? -1 : 530);
	},
	{ immediate: true },
);

watch(
	() => props.direction,
	(direction) => {
		codemirror?.setOption('direction', direction === 'rtl' ? direction : 'ltr');
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
	if (!codemirror) return;

	let url = getAssetUrl(image.id);

	if (props.imageToken) {
		url += '?access_token=' + props.imageToken;
	}

	codemirror.replaceSelection(`![${codemirror.getSelection()}](${url})`);

	imageDialogOpen.value = false;
}

function edit(type: Alteration, options?: Record<string, any>) {
	if (codemirror) {
		applyEdit(codemirror, type, options);
	}
}

const menuActive = computed(() => imageDialogOpen.value);
</script>

<template>
	<div
		ref="markdownInterface"
		v-prevent-focusout="menuActive"
		class="interface-input-rich-text-md"
		:class="[view, { disabled, 'non-editable': nonEditable }]"
	>
		<div class="toolbar">
			<template v-if="view === 'editor'">
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
				<VButton x-small value="editor" :class="[{ active: view !== 'preview' }]">
					{{ $t('interfaces.input-rich-text-md.edit') }}
				</VButton>
				<VButton x-small value="preview" :class="[{ active: view === 'preview' }]">
					{{ $t('interfaces.input-rich-text-md.preview') }}
				</VButton>
			</VItemGroup>
		</div>

		<div ref="codemirrorEl"></div>
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

	min-block-size: 300px;
	overflow: hidden;
	font-family: var(--theme--fonts--sans--font-family);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--form--field--input--box-shadow);
	transition-duration: var(--fast);
	transition-timing-function: var(--transition);
	transition-property: box-shadow, border-color;
}

.interface-input-rich-text-md :deep(.CodeMirror-scroll) {
	max-block-size: min(1000px, 80vh);
}

.interface-input-rich-text-md.disabled:not(.non-editable) {
	background-color: var(--theme--form--field--input--background-subdued);
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

.interface-input-rich-text-md :deep(.CodeMirror) {
	font-family: v-bind(editFamily), sans-serif;
	border: none;
	border-radius: 0;
	box-shadow: none;
}

.interface-input-rich-text-md :deep(.CodeMirror .CodeMirror-lines) {
	padding: 0 20px;
}

.interface-input-rich-text-md :deep(.CodeMirror .CodeMirror-lines:first-of-type) {
	margin-block-start: 20px;
}

.interface-input-rich-text-md :deep(.CodeMirror .CodeMirror-lines:last-of-type) {
	margin-block-end: 20px;
}

.interface-input-rich-text-md.preview :deep(.CodeMirror) {
	visibility: hidden;
	position: absolute;
	pointer-events: none;
}

.toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	min-block-size: 40px;
	padding: 0 4px;
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

	padding: 12px;
	@include mixins.form-grid;

	.v-input {
		min-inline-size: 100px;
	}
}
</style>
