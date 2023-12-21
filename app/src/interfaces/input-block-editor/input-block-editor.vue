<script setup lang="ts">
import api, { addTokenToURL } from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import { unexpectedError } from '@/utils/unexpected-error';
import EditorJS from '@editorjs/editorjs';
import { cloneDeep, isEqual } from 'lodash';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import getTools from './tools';
import { useFileHandler } from './use-file-handler';

const props = withDefaults(
	defineProps<{
		disabled?: boolean;
		autofocus?: boolean;
		value?: Record<string, any> | null;
		bordered?: boolean;
		placeholder?: string;
		tools?: string[];
		folder?: string;
		font?: 'sans-serif' | 'monospace' | 'serif';
	}>(),
	{
		value: null,
		bordered: true,
		tools: () => ['header', 'nestedlist', 'code', 'image', 'paragraph', 'checklist', 'quote', 'underline'],
		font: 'sans-serif',
	},
);

const emit = defineEmits<{ input: [value: EditorJS.OutputData | null] }>();

const { t } = useI18n();

const collectionStore = useCollectionsStore();

const { currentPreview, setCurrentPreview, fileHandler, setFileHandler, unsetFileHandler, handleFile } =
	useFileHandler();

const editorjsRef = ref<EditorJS>();
const editorjsIsReady = ref(false);
const uploaderComponentElement = ref<HTMLElement>();
const editorElement = ref<HTMLElement>();
const haveFilesAccess = Boolean(collectionStore.getCollection('directus_files'));
const haveValuesChanged = ref(false);

const tools = getTools(
	{
		addTokenToURL,
		baseURL: api.defaults.baseURL,
		setFileHandler,
		setCurrentPreview,
		getUploadFieldElement: () => uploaderComponentElement,
	},
	props.tools,
	haveFilesAccess,
);

onMounted(async () => {
	editorjsRef.value = new EditorJS({
		logLevel: 'ERROR' as EditorJS.LogLevels,
		holder: editorElement.value,
		readOnly: false,
		placeholder: props.placeholder,
		minHeight: 72,
		onChange: (api) => emitValue(api),
		tools: tools,
	});

	await editorjsRef.value.isReady;
	editorjsIsReady.value = true;

	const sanitizedValue = sanitizeValue(props.value);

	if (sanitizedValue) {
		await editorjsRef.value.render(sanitizedValue);
	}

	if (props.autofocus) {
		editorjsRef.value.focus();
	}
});

onUnmounted(() => {
	editorjsRef.value?.destroy();
});

watch(
	() => props.value,
	async (newVal, oldVal) => {
		// First value will be set in 'onMounted'
		if (!editorjsRef.value || !editorjsIsReady.value) return;

		if (haveValuesChanged.value) {
			haveValuesChanged.value = false;
			return;
		}

		if (isEqual(newVal?.blocks, oldVal?.blocks)) return;

		try {
			const sanitizedValue = sanitizeValue(newVal);

			if (sanitizedValue) {
				await editorjsRef.value.render(sanitizedValue);
			} else {
				editorjsRef.value.clear();
			}
		} catch (error) {
			unexpectedError(error);
		}
	},
);

async function emitValue(context: EditorJS.API) {
	if (props.disabled || !context || !context.saver) return;

	try {
		const result = await context.saver.save();

		haveValuesChanged.value = true;

		if (!result || result.blocks.length < 1) {
			emit('input', null);
			return;
		}

		if (isEqual(result.blocks, props.value?.blocks)) return;

		emit('input', result);
	} catch (error) {
		unexpectedError(error);
	}
}

function sanitizeValue(value: any): EditorJS.OutputData | null {
	if (!value || typeof value !== 'object' || !value.blocks || value.blocks.length < 1) return null;

	return cloneDeep({
		time: value?.time || Date.now(),
		version: value?.version || '0.0.0',
		blocks: value.blocks,
	});
}
</script>

<template>
	<div class="input-block-editor">
		<div ref="editorElement" :class="{ [font]: true, disabled, bordered }"></div>

		<v-drawer
			v-if="haveFilesAccess && !disabled"
			:model-value="fileHandler !== null"
			icon="image"
			:title="t('upload_from_device')"
			cancelable
			@update:model-value="unsetFileHandler"
			@cancel="unsetFileHandler"
		>
			<div class="uploader-drawer-content">
				<div v-if="currentPreview" class="uploader-preview-image">
					<img :src="currentPreview" />
				</div>
				<v-upload
					:ref="uploaderComponentElement"
					:multiple="false"
					:folder="folder"
					from-library
					from-url
					@input="handleFile"
				/>
			</div>
		</v-drawer>
	</div>
</template>

<style lang="scss">
@import './editorjs-overrides.css';
</style>

<style lang="scss" scoped>
.btn--default {
	color: #fff !important;
	background-color: #0d6efd;
	border-color: #0d6efd;
}
.btn--gray {
	color: #fff !important;
	background-color: #7c7c7c;
	border-color: #7c7c7c;
}

.disabled {
	color: var(--theme--form--field--input--foreground-subdued);
	background-color: var(--theme--form--field--input--background-subdued);
	border-color: var(--theme--form--field--input--border-color);
	pointer-events: none;
}

.bordered {
	padding: var(--theme--form--field--input--padding) max(32px, calc(var(--theme--form--field--input--padding) + 16px));
	background-color: var(--theme--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);

	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
	}

	&:focus-within {
		border-color: var(--theme--form--field--input--border-color-focus);
	}
}

.monospace {
	font-family: var(--theme--fonts--monospace--font-family);
}

.serif {
	font-family: var(--theme--fonts--serif--font-family);
}

.sans-serif {
	font-family: var(--theme--fonts--sans--font-family);
}

.uploader-drawer-content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

.uploader-preview-image {
	margin-bottom: var(--theme--form--row-gap);
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
}

.uploader-preview-image img {
	display: block;
	width: auto;
	max-width: 100%;
	height: auto;
	max-height: 40vh;
	margin: 0 auto;
	object-fit: contain;
}
</style>
