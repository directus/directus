<template>
	<div class="image" :class="[width, { crop }]">
		<v-skeleton-loader v-if="loading" type="input-tall" />

		<v-notice v-else-if="disabled && !image" class="disabled-placeholder" center icon="block">
			{{ t('disabled') }}
		</v-notice>

		<div v-else-if="image" class="image-preview" :class="{ 'is-svg': image.type && image.type.includes('svg') }">
			<div v-if="imageError || !src" class="image-error">
				<v-icon large :name="imageError === 'UNKNOWN' ? 'error_outline' : 'info_outline'" />

				<span class="message">
					{{ t(`errors.${imageError}`) }}
				</span>
			</div>

			<v-image
				v-else-if="image.type.startsWith('image')"
				:src="src"
				:width="image.width"
				:height="image.height"
				alt=""
				role="presentation"
				@error="imageErrorHandler"
			/>

			<div v-else class="fallback">
				<v-icon-file :ext="ext" />
			</div>

			<div class="shadow" />

			<div v-if="!disabled && cropInfo && image" class="actions">
				<v-button
					v-tooltip="t('download')"
					icon
					rounded
					:href="downloadSrc"
					:download="cropInfo.filename_download || image.filename_download"
				>
					<v-icon name="file_download" />
				</v-button>
				<v-button v-tooltip="t('edit_crop_details')" icon rounded @click="editCropDetails = true">
					<v-icon name="open_in_new" />
				</v-button>
				<v-button v-tooltip="t('edit_image')" icon rounded @click="editImageEditor = true">
					<v-icon name="tune" />
				</v-button>
				<v-button v-tooltip="t('deselect')" icon rounded @click="deselect">
					<v-icon name="close" />
				</v-button>
			</div>

			<div class="info">
				<div class="title">{{ image.title }}</div>
				<div class="meta">{{ meta }}</div>
			</div>

			<drawer-item
				v-if="!disabled && relationInfo && cropInfo && image"
				v-model:active="editCropDetails"
				:collection="relationInfo.relatedCollection.collection"
				:primary-key="cropInfo.id"
				:edits="edits"
				@input="update"
			>
				<template #actions>
					<v-button
						secondary
						rounded
						icon
						:download="cropInfo.filename_download || image.filename_download"
						:href="downloadSrc"
					>
						<v-icon name="download" />
					</v-button>
				</template>
			</drawer-item>

			<image-editor
				v-if="!disabled && image"
				:id="image.id"
				v-model="editImageEditor"
				:crop-info="cropInfoForEditor"
				:crop-collection="cropCollection"
				@refresh="refresh"
				@replace-image="replaceImage($event.id)"
				@update-crop-info="updateCropInfo"
			/>
		</div>
		<v-upload v-else from-library from-url :folder="folder" @input="replaceImage($event.id)" />
	</div>
</template>

<script setup lang="ts">
import api, { addTokenToURL } from '@/api';
import { useRelationM2O } from '@/composables/use-relation-m2o';
import { useItem } from '@/composables/use-item';
import { RelationQuerySingle, useRelationSingle } from '@/composables/use-relation-single';
import { getRootPath } from '@/utils/get-root-path';
import { readableMimeType } from '@/utils/readable-mime-type';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import ImageEditor from '@/views/private/components/image-editor.vue';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		value?: string | number | null | Record<string, any>;
		disabled?: boolean;
		folder?: string;
		collection: string;
		primaryKey: string;
		field: string;
		width: string;
		crop?: boolean;
	}>(),
	{
		value: () => null,
		disabled: false,
		crop: true,
		folder: undefined,
	}
);

const emit = defineEmits(['input']);

const cropID = computed({
	get: () => props.value ?? null,
	set: (value) => {
		emit('input', value);
	},
});

const cropQuery = ref<RelationQuerySingle>({
	fields: [
		'x,y,width,height,image_transformations,name,file_id.id,file_id.modified_on,file_id.filename_download,file_id.type,file_id.width,file_id.height',
	],
});
const { collection, field } = toRefs(props);
const { relationInfo } = useRelationM2O(collection, field);
const { displayItem: cropInfo, loading, update, remove, refresh } = useRelationSingle(cropID, cropQuery, relationInfo);

const fileID = computed({
	get() {
		if (!cropInfo.value) return null;
		return cropInfo.value.file_id;
	},
	set(newVal) {
		return newVal;
	},
});
const file = useItem(ref('directus_files'), fileID);

const image = computed(() => {
	// Note: it is a preloaded file row, not file ID
	if (cropInfo.value && typeof cropInfo.value.file_id === 'object') return cropInfo.value.file_id;

	if (file && file.item.value) return file.item.value;

	return null;
});

const cropInfoForEditor = computed(() => {
	let coordinates = null;
	if (
		cropInfo.value &&
		cropInfo.value.x != null &&
		cropInfo.value.y != null &&
		cropInfo.value.height != null &&
		cropInfo.value.width != null
	) {
		coordinates = {
			x: cropInfo.value.x,
			y: cropInfo.value.y,
			width: cropInfo.value.width,
			height: cropInfo.value.height,
		};
	}
	const primaryKey = props.primaryKey == '+' ? null : props.primaryKey;
	const cropCollection = relationInfo.value ? relationInfo.value.relatedCollection.collection : null;

	return {
		coordinates: coordinates,
		imageTransformations: cropInfo.value?.image_transformations,
		collection: collection.value,
		cropCollection: cropCollection,
		id: cropID.value || null,
		fileID: fileID.value || null,
		item: primaryKey,
	};
});

const cropCollection = computed(() => relationInfo.value?.relatedCollection.collection);

const { t, n, te } = useI18n();

const editDrawerActive = ref(false);
const imageError = ref<string | null>(null);

const src = computed(() => {
	if (!image.value || !cropInfo.value) return null;

	if (image.value.type.includes('image')) {
		let url = `/assets/${image.value.id}?cache-buster=${image.value.modified_on}`;
		if (cropInfo.value.image_transformations) {
			url = applyImageTransformationsToUrl(url);
		}
		return addTokenToURL(url);
	}

	return null;
});

const ext = computed(() => (image.value ? readableMimeType(image.value.type, true) : 'unknown'));

const downloadSrc = computed(() => {
	let url = `${getRootPath()}assets/${image.value.id}`;
	if (!cropInfo.value) {
		return addTokenToURL(url);
	} else {
		url = applyImageTransformationsToUrl(url, '?');
		return addTokenToURL(url);
	}
});

const meta = computed(() => {
	if (!cropInfo.value || !image.value) return null;

	const { type, width: originalWidth, height: originalHeight } = image.value;
	const width = cropInfo.value.width;
	const height = cropInfo.value.height;

	let dimensions = width && height ? `${n(width)}x${n(height)}` : null;
	if (!dimensions && originalWidth && originalHeight) dimensions = `${n(originalWidth)}x${n(originalHeight)}`;

	const properties = [cropInfo.value.filename_download, dimensions, type];
	return properties.filter((x) => !!x).join(' • ');
});

const editCropDetails = ref(false);
const editImageEditor = ref(false);

function applyImageTransformationsToUrl(url: string, paramStart = '&'): string {
	let readyTransformations = [];

	if (cropInfo.value && cropInfo.value.image_transformations) {
		const flipY = cropInfo.value.image_transformations.flipY;
		const flipX = cropInfo.value.image_transformations.flipX;
		if (flipY) {
			readyTransformations.push('["flop"]');
		}
		if (flipX) {
			readyTransformations.push('["flip"]');
		}

		let rotation = cropInfo.value.image_transformations.rotate;
		if (rotation != null && rotation != 0) {
			readyTransformations.push(`["rotate", ${rotation}]`);
		}
	}

	const coordinates = cropInfoForEditor.value.coordinates;
	if (coordinates) {
		readyTransformations.push(
			`["extract",{"width": ${coordinates.width}, "height": ${coordinates.height}, "left": ${coordinates.x}, "top": ${coordinates.y}}]`
		);
	}
	if (readyTransformations.length > 0) {
		url += `${paramStart}transforms=[${readyTransformations.join(',')}]`;
	}

	return url;
}

async function imageErrorHandler() {
	if (!src.value) return;
	try {
		await api.get(src.value);
	} catch (err: any) {
		imageError.value = err.response?.data?.errors[0]?.extensions?.code;

		if (!imageError.value || !te('errors.' + imageError.value)) {
			imageError.value = 'UNKNOWN';
		}
	}
}

async function replaceImage(item: string | number) {
	try {
		fileID.value = item;
		cropID.value = { file_id: item, collection: collection.value };
	} catch (err: any) {
		console.log(err);
	}
}

function updateCropInfo(payload: { coordinates: object; image_transformations: object }) {
	if (cropID.value && typeof cropID.value === 'object') cropID.value = { ...cropID.value, ...payload };
	if (cropID.value && (typeof cropID.value === 'string' || typeof cropID.value === 'number'))
		cropID.value = { id: cropID.value, ...payload };
}

function deselect() {
	remove();

	loading.value = false;
	editDrawerActive.value = false;
	editCropDetails.value = false;
	editImageEditor.value = false;
}

const edits = computed(() => {
	if (!cropID.value || typeof cropID.value !== 'object') return {};
	return cropID.value;
});
</script>

<style lang="scss" scoped>
.image-preview {
	position: relative;
	width: 100%;
	height: var(--input-height-tall);
	overflow: hidden;
	background-color: var(--background-normal-alt);
	border-radius: var(--border-radius);
}

img {
	z-index: 1;
	width: 100%;
	height: 100%;
	max-height: inherit;
	object-fit: contain;
}

.is-svg {
	padding: 32px;

	img {
		object-fit: contain;
	}
}

.image-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: var(--foreground-subdued);
	background-color: var(--background-normal);
	padding: 32px;

	.v-icon {
		margin-bottom: 6px;
	}

	.message {
		max-width: 300px;
		padding: 0 16px;
		text-align: center;
	}
}
.image-preview {
	.shadow {
		position: absolute;
		bottom: 0;
		left: 0;
		z-index: 2;
		width: 100%;
		height: 40px;
		overflow: hidden;
		line-height: 1;
		white-space: nowrap;
		text-overflow: ellipsis;
		background: linear-gradient(180deg, rgb(38 50 56 / 0) 0%, rgb(38 50 56 / 0.25) 100%);
		transition: height var(--fast) var(--transition);
	}

	.actions {
		--v-button-color: var(--foreground-subdued);
		--v-button-background-color: var(--white);
		--v-button-color-hover: var(--foreground-normal);
		--v-button-background-color-hover: var(--white);

		position: absolute;
		top: calc(50% - 32px);
		left: 0;
		z-index: 3;
		display: flex;
		justify-content: center;
		width: 100%;

		.v-button {
			margin-right: 12px;
			transform: translateY(10px);
			opacity: 0;
			transition: var(--medium) var(--transition);
			transition-property: opacity transform;

			@for $i from 0 through 4 {
				&:nth-of-type(#{$i + 1}) {
					transition-delay: $i * 25ms;
				}
			}
		}

		.v-button:last-child {
			margin-right: 0px;
		}
	}

	.info {
		position: absolute;
		bottom: 0;
		left: 0;
		z-index: 3;
		width: 100%;
		padding: 8px 12px;
		line-height: 1.2;
	}

	.title {
		color: var(--white);
	}

	.meta {
		height: 17px;
		max-height: 0;
		overflow: hidden;
		color: rgb(255 255 255 / 0.75);
		transition: max-height var(--fast) var(--transition);
	}
}

.image-preview:focus-within,
.image-preview:hover {
	.shadow {
		height: 100%;
		background: linear-gradient(180deg, rgb(38 50 56 / 0) 0%, rgb(38 50 56 / 0.5) 100%);
	}

	.actions .v-button {
		transform: translateY(0px);
		opacity: 1;
	}

	.meta {
		max-height: 17px;
	}
}

.image {
	&.full,
	&.fill {
		.image-preview {
			height: auto;
			max-height: 400px;
		}
	}

	&.crop {
		.image-preview {
			img {
				object-fit: cover;
			}
		}
	}
}

.disabled-placeholder {
	height: var(--input-height-tall);
}

.fallback {
	background-color: var(--background-normal);
	display: flex;
	align-items: center;
	justify-content: center;
	height: var(--input-height-tall);
	border-radius: var(--border-radius);
}
</style>
