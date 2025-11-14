<script setup lang="ts">
import api from '@/api';
import { useRelationM2O } from '@/composables/use-relation-m2o';
import { useRelationPermissionsM2O } from '@/composables/use-relation-permissions';
import { RelationQuerySingle, useRelationSingle } from '@/composables/use-relation-single';
import { formatFilesize } from '@/utils/format-filesize';
import { getAssetUrl } from '@/utils/get-asset-url';
import { parseFilter } from '@/utils/parse-filter';
import { readableMimeType } from '@/utils/readable-mime-type';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import FileLightbox from '@/views/private/components/file-lightbox.vue';
import ImageEditor from '@/views/private/components/image-editor.vue';
import type { File, Filter } from '@directus/types';
import { deepMap } from '@directus/utils';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		value: string | Record<string, any> | null;
		disabled?: boolean;
		nonEditable?: boolean;
		loading?: boolean;
		folder?: string;
		filter?: Filter;
		collection: string;
		field: string;
		width: string;
		crop?: boolean;
		letterbox?: boolean;
		enableCreate?: boolean;
		enableSelect?: boolean;
	}>(),
	{
		crop: true,
		enableCreate: true,
		enableSelect: true,
		nonEditable: false,
	},
);

const emit = defineEmits<{
	input: [value: string | Record<string, any> | null];
}>();

const value = computed({
	get: () => props.value,
	set: (value) => {
		emit('input', value);
	},
});

const query = ref<RelationQuerySingle>({
	fields: ['id', 'title', 'width', 'height', 'filesize', 'type', 'filename_download', 'modified_on'],
});

const { collection, field } = toRefs(props);
const { relationInfo } = useRelationM2O(collection, field);

const {
	displayItem: image,
	loading,
	update,
	remove,
	refresh,
} = useRelationSingle<
	Pick<File, 'id' | 'title' | 'width' | 'height' | 'filesize' | 'type' | 'filename_download' | 'modified_on'>
>(value, query, relationInfo, { enabled: computed(() => !props.loading) });

const isImage = ref(true);

const { n, te } = useI18n();

const lightboxActive = ref(false);
const editDrawerActive = ref(false);
const imageError = ref<string | null>(null);

const src = computed(() => {
	if (!image.value?.type) return null;

	if (image.value.type.includes('svg')) {
		return getAssetUrl(image.value.id);
	}

	if (image.value.type.includes('image')) {
		const fit = props.crop ? 'cover' : 'contain';

		return getAssetUrl(image.value.id, {
			imageKey: `system-large-${fit}`,
			cacheBuster: image.value.modified_on,
		});
	}

	return null;
});

const ext = computed(() => (image.value?.type ? readableMimeType(image.value.type, true) : 'unknown'));

const meta = computed(() => {
	if (!image.value) return null;
	const { filesize, width, height, type } = image.value;

	if (width && height) {
		return `${n(width)}x${n(height)} • ${formatFilesize(filesize)} • ${type}`;
	}

	return `${formatFilesize(filesize)} • ${type}`;
});

const editImageDetails = ref(false);
const editImageEditor = ref(false);

const internalDisabled = computed(() => {
	return props.disabled || (props.enableCreate === false && props.enableSelect === false);
});

async function imageErrorHandler() {
	isImage.value = false;
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

const values = inject('values', ref<Record<string, unknown>>({}));

const customFilter = computed(() => {
	return parseFilter(
		deepMap(props.filter, (val: unknown) => {
			if (val && typeof val === 'string') {
				return render(val, values.value);
			}

			return val;
		}),
	);
});

function onUpload(image: any) {
	if (image?.id) update(image.id);
}

function deselect() {
	remove();

	loading.value = false;
	lightboxActive.value = false;
	editDrawerActive.value = false;
	editImageDetails.value = false;
	editImageEditor.value = false;
}

const edits = computed(() => {
	if (!props.value || typeof props.value !== 'object') return {};

	return props.value;
});

const { createAllowed, updateAllowed } = useRelationPermissionsM2O(relationInfo);
</script>

<template>
	<div class="image" :class="[width, { crop }]">
		<v-skeleton-loader v-if="loading" type="input-tall" />

		<v-notice v-else-if="internalDisabled && !image" class="disabled-placeholder" center icon="hide_image">
			{{ $t('no_image_selected') }}
		</v-notice>

		<div v-else-if="image" class="image-preview">
			<div v-if="imageError || !src" class="image-error">
				<v-icon large :name="imageError === 'UNKNOWN' ? 'error' : 'info'" />

				<span class="message">
					{{ src ? $t(`errors.${imageError}`) : $t('errors.UNSUPPORTED_MEDIA_TYPE') }}
				</span>
			</div>

			<v-image
				v-else-if="image.type?.startsWith('image') && isImage"
				:src="src"
				:class="{ 'is-letterbox': letterbox }"
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

			<div class="actions">
				<v-button v-tooltip="$t('zoom')" icon rounded @click="lightboxActive = true">
					<v-icon name="zoom_in" />
				</v-button>

				<v-button
					v-tooltip="$t('download')"
					icon
					rounded
					:href="getAssetUrl(image.id, { isDownload: true })"
					:download="image.filename_download"
				>
					<v-icon name="download" />
				</v-button>

				<template v-if="!internalDisabled || nonEditable">
					<v-button v-tooltip="$t('edit_item')" icon rounded @click="editImageDetails = true">
						<v-icon name="edit" />
					</v-button>

					<v-button
						v-if="updateAllowed && !nonEditable"
						v-tooltip="$t('edit_image')"
						icon
						rounded
						@click="editImageEditor = true"
					>
						<v-icon name="tune" />
					</v-button>

					<v-remove
						v-if="!nonEditable"
						button
						deselect
						:item-info="relationInfo"
						:item-edits="edits"
						@action="deselect"
					/>
				</template>
			</div>

			<div class="info">
				<div class="title">{{ image.title }}</div>
				<div class="meta">{{ meta }}</div>
			</div>

			<drawer-item
				v-if="image"
				v-model:active="editImageDetails"
				:disabled="internalDisabled"
				:non-editable="nonEditable"
				collection="directus_files"
				:primary-key="image.id"
				:edits="edits"
				@input="update"
			>
				<template #actions>
					<v-button
						secondary
						rounded
						icon
						:download="image.filename_download"
						:href="getAssetUrl(image.id, { isDownload: true })"
					>
						<v-icon name="download" />
					</v-button>
				</template>
			</drawer-item>

			<image-editor v-if="!internalDisabled" :id="image.id" v-model="editImageEditor" @refresh="refresh" />

			<file-lightbox v-model="lightboxActive" :file="image" />
		</div>
		<v-upload
			v-else
			from-url
			:from-user="createAllowed && enableCreate"
			:from-library="enableSelect"
			:folder="folder"
			:filter="customFilter"
			@input="onUpload"
		/>
	</div>
</template>

<style lang="scss" scoped>
img {
	z-index: 1;
	inline-size: 100%;
	block-size: 100%;
	max-block-size: inherit;
	object-fit: contain;
}

.is-letterbox {
	padding: 32px;
}

.image-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	block-size: 100%;
	color: var(--theme--form--field--input--foreground-subdued);
	background-color: var(--theme--background-normal);
	padding: 32px;

	.v-icon {
		margin-block-end: 6px;
	}

	.message {
		max-inline-size: 300px;
		padding: 0 16px;
		text-align: center;
	}
}

.image-preview {
	position: relative;
	inline-size: 100%;
	block-size: var(--input-height-tall);
	overflow: hidden;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);

	.shadow {
		position: absolute;
		inset-block-end: 0;
		inset-inline-start: 0;
		z-index: 2;
		inline-size: 100%;
		block-size: 40px;
		overflow: hidden;
		line-height: 1;
		white-space: nowrap;
		text-overflow: ellipsis;
		background: linear-gradient(180deg, rgb(38 50 56 / 0) 0%, rgb(38 50 56 / 0.25) 100%);
		transition: block-size var(--fast) var(--transition);
	}

	.actions {
		--v-button-color: var(--theme--form--field--input--foreground-subdued);
		--v-button-background-color: var(--white);
		--v-button-color-hover: var(--theme--form--field--input--foreground);
		--v-button-background-color-hover: var(--white);

		position: absolute;
		inset-block-start: calc(50% - 32px);
		inset-inline-start: 0;
		z-index: 3;
		display: flex;
		justify-content: center;
		inline-size: 100%;
		gap: 12px;

		::v-deep(.v-button) {
			transform: translateY(10px);
			opacity: 0;
			transition: var(--medium) var(--transition);
			transition-property: opacity, transform;

			@for $i from 0 through 4 {
				&:nth-of-type(#{$i + 1}) {
					transition-delay: $i * 25ms;
				}
			}
		}
	}

	.info {
		position: absolute;
		inset-block-end: 0;
		inset-inline-start: 0;
		z-index: 3;
		inline-size: 100%;
		padding: 8px 12px;
		line-height: 1.2;
	}

	.title {
		color: var(--white);
	}

	.meta {
		block-size: 17px;
		max-block-size: 0;
		overflow: hidden;
		color: rgb(255 255 255 / 0.75);
		transition: max-block-size var(--fast) var(--transition);
	}
}

.image-preview:focus-within,
.image-preview:hover {
	.shadow {
		block-size: 100%;
		background: linear-gradient(180deg, rgb(38 50 56 / 0) 0%, rgb(38 50 56 / 0.5) 100%);
	}

	.actions ::v-deep(.v-button) {
		transform: translateY(0);
		opacity: 1;
	}

	.meta {
		max-block-size: 17px;
	}
}

.image {
	&.full,
	&.fill {
		.image-preview {
			block-size: auto;
			max-block-size: 400px;
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
	block-size: var(--input-height-tall);
}

.fallback {
	background-color: var(--theme--background-normal);
	display: flex;
	align-items: center;
	justify-content: center;
	block-size: var(--input-height-tall);
	border-radius: var(--theme--border-radius);
}
</style>
