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

			<img
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

			<div v-if="!disabled" class="actions">
				<v-button v-tooltip="t('zoom')" icon rounded @click="lightboxActive = true">
					<v-icon name="zoom_in" />
				</v-button>
				<v-button v-tooltip="t('download')" icon rounded :href="downloadSrc" :download="image.filename_download">
					<v-icon name="get_app" />
				</v-button>
				<v-button v-tooltip="t('edit')" icon rounded @click="editDrawerActive = true">
					<v-icon name="open_in_new" />
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
				v-if="!disabled && image"
				v-model:active="editDrawerActive"
				collection="directus_files"
				:primary-key="image.id"
				:edits="edits"
				@input="update"
			/>

			<file-lightbox :id="image.id" v-model="lightboxActive" />
		</div>
		<v-upload v-else from-library from-url :folder="folder" @input="update($event.id)" />
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, computed, toRefs } from 'vue';
import api, { addTokenToURL } from '@/api';
import formatFilesize from '@/utils/format-filesize';
import { getRootPath } from '@/utils/get-root-path';
import DrawerItem from '@/views/private/components/drawer-item';
import { RelationQuerySingle, useRelationM2O, useRelationSingle } from '@/composables/use-relation';
import FileLightbox from '@/views/private/components/file-lightbox';
import { nanoid } from 'nanoid';
import { readableMimeType } from '@/utils/readable-mime-type';

const props = withDefaults(
	defineProps<{
		value?: string | Record<string, any> | null;
		disabled?: boolean;
		folder?: string;
		collection: string;
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

const value = computed({
	get: () => props.value ?? null,
	set: (value) => {
		emit('input', value);
	},
});

const query = ref<RelationQuerySingle>({
	fields: ['id', 'title', 'width', 'height', 'filesize', 'type', 'filename_download'],
});

const { collection, field } = toRefs(props);
const { relationInfo } = useRelationM2O(collection, field);
const { displayItem: image, loading, update, remove } = useRelationSingle(value, query, relationInfo);

const { t, n, te } = useI18n();

const lightboxActive = ref(false);
const editDrawerActive = ref(false);
const imageError = ref<string | null>(null);

const cacheBuster = ref(nanoid());

const src = computed(() => {
	if (!image.value) return null;

	if (image.value.type.includes('svg')) {
		return addTokenToURL(getRootPath() + `assets/${image.value.id}`);
	}
	if (image.value.type.includes('image')) {
		const fit = props.crop ? 'cover' : 'contain';
		const url = getRootPath() + `assets/${image.value.id}?key=system-large-${fit}&cache-buster=${cacheBuster.value}`;
		return addTokenToURL(url);
	}

	return null;
});

const ext = computed(() => (image.value ? readableMimeType(image.value.type, true) : 'unknown'));

const downloadSrc = computed(() => {
	if (!image.value) return null;
	return addTokenToURL(getRootPath() + `assets/${image.value.id}`);
});

const meta = computed(() => {
	if (!image.value) return null;
	const { filesize, width, height, type } = image.value;

	if (width && height) {
		return `${n(width)}x${n(height)} • ${formatFilesize(filesize)} • ${type}`;
	}

	return `${formatFilesize(filesize)} • ${type}`;
});

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

function deselect() {
	remove();

	loading.value = false;
	lightboxActive.value = false;
	editDrawerActive.value = false;
}

const edits = computed(() => {
	if (!props.value || typeof props.value !== 'object') return {};

	return props.value;
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
