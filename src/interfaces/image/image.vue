<template>
	<v-skeleton-loader v-if="loading" type="input-tall" />
	<div class="image-preview" v-else-if="image" :class="{ isSVG: image.type.includes('svg') }">
		<img :src="src" alt="" role="presentation" />
		<div class="shadow" />
		<div class="actions">
			<v-button icon rounded @click="lightboxActive = true" v-tooltip="$t('zoom')">
				<v-icon name="zoom_in" />
			</v-button>
			<v-button
				icon
				rounded
				:href="image.data.full_url"
				:download="image.filename_download"
				v-tooltip="$t('download')"
			>
				<v-icon name="file_download" />
			</v-button>
			<v-button icon rounded @click="lightboxActive = true" v-tooltip="$t('open')">
				<v-icon name="launch" />
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
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from '@vue/composition-api';
import api from '@/api';
import useProjectsStore from '@/stores/projects';
import formatFilesize from '@/utils/format-filesize';
import i18n from '@/lang';
import FileLightbox from '@/views/private/components/file-lightbox';
import ImageEditor from '@/views/private/components/image-editor';
import { nanoid } from 'nanoid';

type Image = {
	type: string;
	data: {
		full_url: string;
		thumbnails: {
			key: string;
			url: string;
		}[];
	};
	filesize: number;
	width: number;
	height: number;
	filename_download: string;
};

export default defineComponent({
	components: { FileLightbox, ImageEditor },
	props: {
		value: {
			type: Number,
			default: null,
		},
	},
	setup(props, { emit }) {
		const projectsStore = useProjectsStore();

		const loading = ref(false);
		const image = ref<Image>(null);
		const error = ref(null);
		const lightboxActive = ref(false);
		const editorActive = ref(false);

		const cacheBuster = ref(nanoid());

		const src = computed(() => {
			if (!image.value) return null;

			if (image.value.type.includes('svg')) {
				return image.value.data.full_url;
			}

			const url = image.value.data.thumbnails.find(
				(thumb) => thumb.key === 'directus-large-crop'
			)?.url;

			if (url) {
				return `${url}&cache-buster=${cacheBuster.value}`;
			}

			return null;
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
		};

		async function fetchImage() {
			const { currentProjectKey } = projectsStore.state;

			loading.value = true;

			try {
				const response = await api.get(`/${currentProjectKey}/files/${props.value}`, {
					params: {
						fields: [
							'id',
							'data',
							'title',
							'width',
							'height',
							'filesize',
							'type',
							'filename_download',
						],
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
	border-radius: var(--border-radius);
}

img {
	z-index: 1;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.isSVG {
	padding: 32px;
	background-color: var(--background-subdued);

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
</style>
