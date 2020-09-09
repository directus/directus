<template>
	<div class="image">
		<v-skeleton-loader v-if="loading" type="input-tall" />

		<v-notice class="disabled-placeholder" v-else-if="disabled && !image" center icon="block">
			{{ $t('disabled') }}
		</v-notice>

		<div class="image-preview" v-else-if="image" :class="{ 'is-svg': image.type.includes('svg') }">
			<img :src="src" alt="" role="presentation" />

			<div class="shadow" />

			<div class="actions" v-if="!disabled">
				<v-button icon rounded @click="lightboxActive = true" v-tooltip="$t('zoom')">
					<v-icon name="zoom_in" />
				</v-button>
				<v-button
					icon
					rounded
					:href="downloadSrc"
					:download="image.filename_download"
					v-tooltip="$t('download')"
				>
					<v-icon name="get_app" />
				</v-button>
				<v-button icon rounded @click="editorActive = true" v-tooltip="$t('edit')">
					<v-icon name="crop_rotate" />
				</v-button>
				<v-button icon rounded @click="deselect" v-tooltip="$t('deselect')">
					<v-icon name="close" />
				</v-button>
			</div>

			<div class="info">
				<div class="title">{{ image.title }}</div>
				<div class="meta">{{ meta }}</div>
			</div>

			<image-editor
				v-if="image && image.type.startsWith('image')"
				:id="image.id"
				@refresh="changeCacheBuster"
				v-model="editorActive"
			/>
			<file-lightbox v-model="lightboxActive" :id="image.id" />
		</div>
		<v-upload v-else @upload="setImage" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from '@vue/composition-api';
import api from '@/api';
import formatFilesize from '@/utils/format-filesize';
import i18n from '@/lang';
import FileLightbox from '@/views/private/components/file-lightbox';
import ImageEditor from '@/views/private/components/image-editor';
import { nanoid } from 'nanoid';
import getRootPath from '@/utils/get-root-path';

type Image = {
	id: string; // uuid
	type: string;
	filesize: number;
	width: number;
	height: number;
	filename_download: string;
};

export default defineComponent({
	components: { FileLightbox, ImageEditor },
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const loading = ref(false);
		const image = ref<Image | null>(null);
		const error = ref(null);
		const lightboxActive = ref(false);
		const editorActive = ref(false);

		const cacheBuster = ref(nanoid());

		const src = computed(() => {
			if (!image.value) return null;

			if (image.value.type.includes('svg')) {
				return getRootPath() + `assets/${image.value.id}`;
			}

			if (image.value.type.includes('image')) {
				return (
					getRootPath() + `assets/${image.value.id}?key=system-large-cover&cache-buster=${cacheBuster.value}`
				);
			}

			return null;
		});

		const downloadSrc = computed(() => {
			if (!image.value) return null;
			return getRootPath() + `assets/${image.value.id}`;
		});

		const meta = computed(() => {
			if (!image.value) return null;
			const { filesize, width, height, type } = image.value;

			return `${i18n.n(width)}x${i18n.n(height)} • ${formatFilesize(filesize)} • ${type}`;
		});

		watch(
			() => props.value,
			(newID, oldID) => {
				if (newID === oldID) return;

				if (newID) {
					fetchImage();
				}

				if (oldID && newID === null) {
					deselect();
				}
			}
		);

		return {
			loading,
			image,
			error,
			src,
			meta,
			lightboxActive,
			editorActive,
			changeCacheBuster,
			setImage,
			deselect,
			downloadSrc,
		};

		async function fetchImage() {
			loading.value = true;

			try {
				const response = await api.get(`/files/${props.value}`, {
					params: {
						fields: ['id', 'title', 'width', 'height', 'filesize', 'type', 'filename_download'],
					},
				});

				image.value = response.data.data;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
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
			error.value = null;
			lightboxActive.value = false;
			editorActive.value = false;
		}
	},
});
</script>

<style lang="scss" scoped>
.image-preview {
	position: relative;
	width: 100%;
	height: var(--input-height-tall);
	overflow: hidden;
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);
}

img {
	z-index: 1;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.is-svg {
	padding: 32px;
	background-color: var(--background-normal);

	img {
		object-fit: contain;
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
	background: linear-gradient(180deg, rgba(38, 50, 56, 0) 0%, rgba(38, 50, 56, 0.25) 100%);
	transition: height var(--fast) var(--transition);
}

.actions {
	--v-button-color: var(--foreground-subdued);
	--v-button-background-color: var(--white);
	--v-button-color-hover: var(--foreground-normal);
	--v-button-background-color-hover: var(--white);

	position: absolute;
	top: 30%;
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
	color: rgba(255, 255, 255, 0.75);
	transition: max-height var(--fast) var(--transition);
}

.image-preview:hover {
	.shadow {
		height: 100%;
		background: linear-gradient(180deg, rgba(38, 50, 56, 0) 0%, rgba(38, 50, 56, 0.5) 100%);
	}

	.actions .v-button {
		transform: translateY(0px);
		opacity: 1;
	}

	.meta {
		max-height: 17px;
	}
}

.disabled-placeholder {
	height: var(--input-height-tall);
}
</style>
