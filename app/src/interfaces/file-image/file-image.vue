<template>
	<div class="image" :class="width">
		<v-skeleton-loader v-if="loading" type="input-tall" />

		<v-notice v-else-if="disabled && !image" class="disabled-placeholder" center icon="block">
			{{ t('disabled') }}
		</v-notice>

		<div
			v-else-if="image"
			ref="imageContainer"
			class="image-preview"
			:class="{ 'is-svg': image.type && image.type.includes('svg') }"
			:style="{ maxHeight: 400 + 'px' }"
		>
			<div v-if="imageError" class="image-error">
				<v-icon large :name="imageError === 'UNKNOWN' ? 'error_outline' : 'info_outline'" />

				<span class="message">
					{{ t(`errors.${imageError}`) }}
				</span>
			</div>
			<img v-else :src="src" alt="" role="presentation" :class="fit" @error="imageErrorHandler" />

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
				@input="stageEdits"
			/>

			<file-lightbox :id="image.id" v-model="lightboxActive" />
		</div>
		<v-upload v-else from-library from-url :folder="folder" @input="setImage" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch, computed, PropType } from 'vue';
import api from '@/api';
import formatFilesize from '@/utils/format-filesize';
import FileLightbox from '@/views/private/components/file-lightbox';
import { nanoid } from 'nanoid';
import { getRootPath } from '@/utils/get-root-path';
import { unexpectedError } from '@/utils/unexpected-error';
import { addTokenToURL } from '@/api';
import DrawerItem from '@/views/private/components/drawer-item';

type Image = {
	id: string; // uuid
	type: string;
	filesize: number;
	width: number;
	height: number;
	filename_download: string;
};

export default defineComponent({
	components: { FileLightbox, DrawerItem },
	props: {
		value: {
			type: [String, Object] as PropType<string | Record<string, any>>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		folder: {
			type: String,
			default: undefined,
		},
		width: {
			type: String,
			required: true,
		},
		crop: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const imageMaxHeightPx = 400;
		const { t, n, te } = useI18n();

		const loading = ref(false);
		const image = ref<Image | null>(null);
		const imageContainer = ref<HTMLDivElement | null>(null);
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
				const fitParam = props.crop ? 'cover' : 'inside';
				const url =
					getRootPath() +
					`assets/${image.value.id}?width=800&height=800&fit=${fitParam}&withoutEnlargement=true&cache-buster=${cacheBuster.value}`;
				return addTokenToURL(url);
			}

			return null;
		});

		const fit = computed(() => {
			if (image.value && imageContainer.value) {
				if (
					image.value.width >= imageContainer.value.clientWidth &&
					image.value.height >= imageMaxHeightPx &&
					props.crop
				) {
					return 'cover';
				} else if (!props.crop) {
					return 'contain';
				}
			}
			return null;
		});

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

		watch(
			() => props.value,
			(newValue, oldValue) => {
				if (newValue === oldValue) return;

				if (newValue) {
					fetchImage();
				}

				if (oldValue && newValue === null) {
					deselect();
				}
			},
			{ immediate: true }
		);

		const { edits, stageEdits } = useEdits();

		return {
			t,
			loading,
			image,
			imageContainer,
			fit,
			src,
			imageError,
			imageErrorHandler,
			meta,
			lightboxActive,
			editDrawerActive,
			changeCacheBuster,
			setImage,
			deselect,
			downloadSrc,
			edits,
			stageEdits,
			imageMaxHeightPx,
		};

		async function fetchImage() {
			loading.value = true;

			try {
				const id = typeof props.value === 'string' ? props.value : props.value?.id;

				const response = await api.get(`/files/${id}`, {
					params: {
						fields: ['id', 'title', 'width', 'height', 'filesize', 'type', 'filename_download'],
					},
				});

				if (props.value !== null && typeof props.value === 'object') {
					image.value = {
						...response.data.data,
						...props.value,
					};
				} else {
					image.value = response.data.data;
				}
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				loading.value = false;
			}
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

		function changeCacheBuster() {
			cacheBuster.value = nanoid();
		}

		function setImage(data: Image) {
			image.value = data;
			emit('input', data.id);
		}

		function deselect() {
			emit('input', null);

			loading.value = false;
			image.value = null;
			lightboxActive.value = false;
			editDrawerActive.value = false;
		}

		function useEdits() {
			const edits = computed(() => {
				// If the current value isn't a primitive, it means we've already staged some changes
				// This ensures we continue on those changes instead of starting over
				if (props.value && typeof props.value === 'object') {
					return props.value;
				}

				return {};
			});

			return { edits, stageEdits };

			function stageEdits(newEdits: Record<string, any>) {
				if (!image.value) return;

				emit('input', {
					id: image.value.id,
					...newEdits,
				});
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.image-preview {
	position: relative;
	width: 100%;
	min-height: var(--input-height-tall);
	overflow: hidden;
	background-color: var(--background-normal-alt);
	border-radius: var(--border-radius);
	display: flex;
	align-items: center;
	justify-content: center;
}

img {
	z-index: 1;
	display: block;
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

.image .image-preview {
	height: auto;

	img {
		&.cover {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
		&.contain {
			max-height: inherit;
			max-width: 100%;
		}
	}
}

.disabled-placeholder {
	height: var(--input-height-tall);
}
</style>
