<template>
	<div class="image">
		<v-skeleton-loader v-if="loading" type="input-tall" />

		<v-notice class="disabled-placeholder" v-else-if="disabled && !image" center icon="block">
			{{ $t('disabled') }}
		</v-notice>

		<div class="image-preview" v-else-if="image" :class="{ 'is-svg': image.type && image.type.includes('svg') }">
			<img :src="src" alt="" role="presentation" />

			<div class="shadow" />

			<div class="actions" v-if="!disabled">
				<v-button icon rounded @click="lightboxActive = true" v-tooltip="$t('zoom')">
					<v-icon name="zoom_in" />
				</v-button>
				<v-button icon rounded :href="downloadSrc" :download="image.filename_download" v-tooltip="$t('download')">
					<v-icon name="get_app" />
				</v-button>
				<v-button icon rounded @click="editDrawerActive = true" v-tooltip="$t('edit')">
					<v-icon name="open_in_new" />
				</v-button>
				<v-button icon rounded @click="deselect" v-tooltip="$t('deselect')">
					<v-icon name="close" />
				</v-button>
			</div>

			<div class="info">
				<div class="title">{{ image.title }}</div>
				<div class="meta">{{ meta }}</div>
			</div>

			<drawer-item
				v-if="!disabled && image"
				:active.sync="editDrawerActive"
				collection="directus_files"
				:primary-key="image.id"
				:edits="edits"
				@input="stageEdits"
			/>

			<file-lightbox v-model="lightboxActive" :id="image.id" />
		</div>
		<v-upload v-else @input="setImage" from-library from-url />
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
	components: { FileLightbox, ImageEditor, DrawerItem },
	props: {
		value: {
			type: [String, Object],
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
		const lightboxActive = ref(false);
		const editDrawerActive = ref(false);

		const cacheBuster = ref(nanoid());

		const src = computed(() => {
			if (!image.value) return null;

			if (image.value.type.includes('svg')) {
				return addTokenToURL(getRootPath() + `assets/${image.value.id}`);
			}

			if (image.value.type.includes('image')) {
				const url = getRootPath() + `assets/${image.value.id}?key=system-large-cover&cache-buster=${cacheBuster.value}`;

				return addTokenToURL(url);
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

			return `${i18n.n(width)}x${i18n.n(height)} • ${formatFilesize(filesize)} • ${type}`;
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
			loading,
			image,
			src,
			meta,
			lightboxActive,
			editDrawerActive,
			changeCacheBuster,
			setImage,
			deselect,
			downloadSrc,
			edits,
			stageEdits,
		};

		async function fetchImage() {
			loading.value = true;

			try {
				const id = typeof props.value === 'string' ? props.value : (props.value as Record<string, any>)?.id;

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
			} catch (err) {
				unexpectedError(err);
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
	background-color: var(--background-normal-alt);

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
