<template>
	<v-drawer v-model="_active" class="modal" :title="$t('editing_image')" persistent @cancel="_active = false">
		<template #activator="activatorBinding">
			<slot name="activator" v-bind="activatorBinding" />
		</template>

		<template #subtitle>
			<span class="warning">{{ $t('changes_are_permanent') }}</span>
		</template>

		<div class="loader" v-if="loading">
			<v-progress-circular indeterminate />
		</div>

		<v-notice type="error" v-else-if="error">error</v-notice>

		<div v-show="imageData && !loading && !error" class="editor-container">
			<div class="editor">
				<img ref="imageElement" :src="imageURL" role="presentation" alt="" @load="onImageLoad" />
			</div>

			<div class="toolbar">
				<div
					v-tooltip.top.inverted="$t('drag_mode')"
					class="drag-mode toolbar-button"
					@click="dragMode = dragMode === 'crop' ? 'move' : 'crop'"
				>
					<v-icon name="pan_tool" :class="{ active: dragMode === 'move' }" />
					<v-icon name="crop" :class="{ active: dragMode === 'crop' }" />
				</div>

				<v-icon name="rotate_90_degrees_ccw" @click="rotate" v-tooltip.top.inverted="$t('rotate')" />

				<v-icon name="flip_horizontal" @click="flip('horizontal')" v-tooltip.top.inverted="$t('flip_horizontal')" />

				<v-icon name="flip_vertical" @click="flip('vertical')" v-tooltip.top.inverted="$t('flip_vertical')" />

				<v-menu placement="top" show-arrow>
					<template #activator="{ toggle }">
						<v-icon :name="aspectRatioIcon" @click="toggle" v-tooltip.top.inverted="$t('aspect_ratio')" />
					</template>

					<v-list>
						<v-list-item @click="aspectRatio = 16 / 9" :active="aspectRatio === 16 / 9">
							<v-list-item-icon><v-icon name="crop_16_9" /></v-list-item-icon>
							<v-list-item-content>16:9</v-list-item-content>
						</v-list-item>
						<v-list-item @click="aspectRatio = 3 / 2" :active="aspectRatio === 3 / 2">
							<v-list-item-icon><v-icon name="crop_3_2" /></v-list-item-icon>
							<v-list-item-content>3:2</v-list-item-content>
						</v-list-item>
						<v-list-item @click="aspectRatio = 5 / 4" :active="aspectRatio === 5 / 4">
							<v-list-item-icon><v-icon name="crop_5_4" /></v-list-item-icon>
							<v-list-item-content>5:4</v-list-item-content>
						</v-list-item>
						<v-list-item @click="aspectRatio = 7 / 5" :active="aspectRatio === 7 / 5">
							<v-list-item-icon><v-icon name="crop_7_5" /></v-list-item-icon>
							<v-list-item-content>7:5</v-list-item-content>
						</v-list-item>
						<v-list-item @click="aspectRatio = 1 / 1" :active="aspectRatio === 1 / 1">
							<v-list-item-icon><v-icon name="crop_square" /></v-list-item-icon>
							<v-list-item-content>{{ $t('square') }}</v-list-item-content>
						</v-list-item>
						<v-list-item @click="aspectRatio = NaN" :active="aspectRatio === NaN">
							<v-list-item-icon><v-icon name="crop_free" /></v-list-item-icon>
							<v-list-item-content>{{ $t('free') }}</v-list-item-content>
						</v-list-item>
						<v-list-item
							v-if="imageData"
							@click="aspectRatio = imageData.width / imageData.height"
							:active="aspectRatio === imageData.width / imageData.height"
						>
							<v-list-item-icon><v-icon name="crop_original" /></v-list-item-icon>
							<v-list-item-content>{{ $t('original') }}</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>

				<div class="spacer" />

				<div class="dimensions" v-if="imageData">
					{{ $n(imageData.width) }}x{{ $n(imageData.height) }}
					<template v-if="imageData.width !== newDimensions.width || imageData.height !== newDimensions.height">
						->
						{{ $n(newDimensions.width) }}x{{ $n(newDimensions.height) }}
					</template>
				</div>

				<button class="toolbar-button cancel" v-show="cropping" @click="cropping = false">
					{{ $t('cancel_crop') }}
				</button>
			</div>
		</div>

		<template #actions>
			<v-button @click="save" :loading="saving" icon rounded v-tooltip.bottom="$t('save')">
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, reactive } from '@vue/composition-api';
import api from '@/api';
import Vue from 'vue';

import Cropper from 'cropperjs';
import { nanoid } from 'nanoid';
import throttle from 'lodash/throttle';
import { unexpectedError } from '@/utils/unexpected-error';
import { addTokenToURL } from '@/api';

type Image = {
	type: string;
	filesize: number;
	filename_download: string;
	width: number;
	height: number;
};

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		id: {
			type: String,
			required: true,
		},
		active: {
			type: Boolean,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const localActive = ref(false);

		const _active = computed({
			get() {
				return props.active === undefined ? localActive.value : props.active;
			},
			set(newActive: boolean) {
				localActive.value = newActive;
				emit('toggle', newActive);
			},
		});

		const { loading, error, imageData, imageElement, save, saving, fetchImage, onImageLoad } = useImage();

		const {
			cropperInstance,
			initCropper,
			flip,
			rotate,
			aspectRatio,
			aspectRatioIcon,
			newDimensions,
			dragMode,
			cropping,
		} = useCropper();

		watch(_active, (isActive) => {
			if (isActive === true) {
				fetchImage();
			} else {
				if (cropperInstance.value) {
					cropperInstance.value.destroy();
				}

				loading.value = false;
				error.value = null;
				imageData.value = null;
			}
		});

		const imageURL = computed(() => {
			return addTokenToURL(`/assets/${props.id}?${nanoid()}`);
		});

		return {
			_active,
			loading,
			error,
			imageData,
			imageElement,
			save,
			onImageLoad,
			flip,
			rotate,
			aspectRatio,
			aspectRatioIcon,
			saving,
			imageURL,
			newDimensions,
			dragMode,
			cropping,
		};

		function useImage() {
			const loading = ref(false);
			const error = ref(null);
			const imageData = ref<Image | null>(null);
			const saving = ref(false);

			const imageElement = ref<HTMLImageElement | null>(null);

			return {
				loading,
				error,
				imageData,
				saving,
				fetchImage,
				imageElement,
				save,
				onImageLoad,
			};

			async function fetchImage() {
				try {
					loading.value = true;

					const response = await api.get(`/files/${props.id}`, {
						params: {
							fields: ['type', 'filesize', 'filename_download', 'width', 'height'],
						},
					});

					imageData.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}

			function save() {
				saving.value = true;

				cropperInstance.value
					?.getCroppedCanvas({
						imageSmoothingQuality: 'high',
					})
					.toBlob(async (blob) => {
						if (blob === null) {
							saving.value = false;
							return;
						}

						const formData = new FormData();
						formData.append('file', blob, imageData.value?.filename_download);

						try {
							await api.patch(`/files/${props.id}`, formData);
							emit('refresh');
							_active.value = false;
						} catch (err) {
							unexpectedError(err);
						} finally {
							saving.value = false;
						}
					}, imageData.value?.type);
			}

			async function onImageLoad() {
				await Vue.nextTick();
				initCropper();
			}
		}

		function useCropper() {
			const cropperInstance = ref<Cropper | null>(null);

			const localAspectRatio = ref(NaN);

			const newDimensions = reactive({
				width: null as null | number,
				height: null as null | number,
			});

			watch(imageData, () => {
				if (!imageData.value) return;
				localAspectRatio.value = imageData.value.width / imageData.value.height;
				newDimensions.width = imageData.value.width;
				newDimensions.height = imageData.value.height;
			});

			const aspectRatio = computed<number>({
				get() {
					return localAspectRatio.value;
				},
				set(newAspectRatio) {
					localAspectRatio.value = newAspectRatio;
					cropperInstance.value?.setAspectRatio(newAspectRatio);
				},
			});

			const aspectRatioIcon = computed(() => {
				if (!imageData.value) return 'crop_original';

				switch (aspectRatio.value) {
					case 16 / 9:
						return 'crop_16_9';
					case 3 / 2:
						return 'crop_3_2';
					case 5 / 4:
						return 'crop_5_4';
					case 7 / 5:
						return 'crop_7_5';
					case 1 / 1:
						return 'crop_square';
					case imageData.value.width / imageData.value.height:
						return 'crop_original';
					default:
						return 'crop_free';
				}
			});

			const localDragMode = ref<'move' | 'crop'>('move');

			const dragMode = computed({
				get() {
					return localDragMode.value;
				},
				set(newMode: 'move' | 'crop') {
					cropperInstance.value?.setDragMode(newMode);
					localDragMode.value = newMode;
				},
			});

			const localCropping = ref(false);
			const cropping = computed({
				get() {
					return localCropping.value;
				},
				set(newCropping: boolean) {
					if (newCropping === false) {
						cropperInstance.value?.clear();
					}

					localCropping.value = newCropping;
				},
			});

			return {
				cropperInstance,
				initCropper,
				flip,
				rotate,
				aspectRatio,
				aspectRatioIcon,
				newDimensions,
				dragMode,
				cropping,
			};

			function initCropper() {
				if (imageElement.value === null) return;

				if (cropperInstance.value) {
					cropperInstance.value.destroy();
				}

				cropperInstance.value = new Cropper(imageElement.value, {
					autoCrop: false,
					toggleDragModeOnDblclick: false,
					dragMode: 'move',
					crop: throttle((event) => {
						if (!imageData.value) return;

						if (cropping.value === false && (event.detail.width || event.detail.height)) {
							cropping.value = true;
						}

						const newWidth = event.detail.width || imageData.value.width;
						const newHeight = event.detail.height || imageData.value.height;

						if (event.detail.rotate === 0 || event.detail.rotate === -180) {
							newDimensions.width = Math.round(newWidth);
							newDimensions.height = Math.round(newHeight);
						} else {
							newDimensions.height = Math.round(newWidth);
							newDimensions.width = Math.round(newHeight);
						}
					}, 50),
				});
			}

			function flip(type: 'horizontal' | 'vertical') {
				if (type === 'vertical') {
					if (cropperInstance.value?.getData().scaleX === -1) {
						cropperInstance.value?.scaleX(1);
					} else {
						cropperInstance.value?.scaleX(-1);
					}
				}

				if (type === 'horizontal') {
					if (cropperInstance.value?.getData().scaleY === -1) {
						cropperInstance.value?.scaleY(1);
					} else {
						cropperInstance.value?.scaleY(-1);
					}
				}
			}

			function rotate() {
				cropperInstance.value?.rotate(-90);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.modal {
	--v-drawer-content-padding-small: 0px;
	--v-drawer-content-padding: 0px;
}

.editor-container {
	width: 100%;
	height: calc(100% - (65px + 24px + 24px)); // header height + 2x margin
	overflow: hidden;
	background-color: var(--background-subdued);

	.editor {
		flex-grow: 1;
		width: 100%;
		height: calc(100% - 60px);
	}

	img {
		// Cropper JS will handle this
		opacity: 0;
	}
}

.loader {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}

.toolbar {
	display: flex;
	align-items: center;
	width: 100%;
	height: 60px;
	padding: 0 24px;
	color: var(--white);
	background-color: #263238;

	.v-icon {
		display: inline-block;
		margin-right: 16px;
	}
}

.spacer {
	flex-grow: 1;
}

.dimensions {
	margin-right: 12px;
	color: var(--foreground-subdued);
	font-feature-settings: 'tnum';
}

.warning {
	color: var(--warning);
}

.toolbar-button {
	padding: 8px;
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: var(--border-radius);
	cursor: pointer;
	transition: background-color var(--fast) var(--transition);

	&:hover {
		background-color: rgba(255, 255, 255, 0.15);
	}
}

.drag-mode {
	margin-right: 16px;
	margin-left: -8px;

	.v-icon {
		margin-right: 0;
		opacity: 0.5;

		&.active {
			opacity: 1;
		}
	}

	.v-icon:first-child {
		margin-right: 8px;
	}
}

.cancel {
	padding-right: 16px;
	padding-left: 16px;
}
</style>
