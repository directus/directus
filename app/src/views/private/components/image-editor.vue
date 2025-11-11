<script setup lang="ts">
import api from '@/api';
import { useSettingsStore } from '@/stores/settings';
import { getAssetUrl } from '@/utils/get-asset-url';
import { unexpectedError } from '@/utils/unexpected-error';
import type { File } from '@directus/types';
import Cropper from 'cropperjs';
import { isEqual } from 'lodash';
import throttle from 'lodash/throttle';
import { nanoid } from 'nanoid/non-secure';
import { computed, nextTick, reactive, ref, watch } from 'vue';

const imageFields = [
	'type',
	'filesize',
	'filename_download',
	'width',
	'height',
	'focal_point_x',
	'focal_point_y',
] as const;

type Image = Pick<File, (typeof imageFields)[number]>;

const props = defineProps<{
	id: string;
	modelValue?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'refresh'): void;
}>();

const { t, n } = useI18n();

const settingsStore = useSettingsStore();

const localActive = ref(false);

const internalActive = computed({
	get() {
		return props.modelValue === undefined ? localActive.value : props.modelValue;
	},
	set(newActive: boolean) {
		localActive.value = newActive;
		emit('update:modelValue', newActive);
	},
});

const { loading, error, imageData, imageElement, hasEdits, save, saving, fetchImage, onImageLoad } = useImage();

const {
	cropperInstance,
	initCropper,
	flip,
	rotate,
	reset,
	aspectRatio,
	aspectRatioIcon,
	newDimensions,
	dragMode,
	cropping,
} = useCropper();

watch(internalActive, (isActive) => {
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

const randomId = ref<string>(nanoid());

const imageURL = computed(() => {
	return getAssetUrl(`${props.id}?${randomId.value}`);
});

const dimensionsString = computed(() => {
	let output = '';
	const isSVG = imageData.value?.type === 'image/svg+xml';

	if (imageData.value) {
		if (isSVG) {
			output += 'SVG';
		} else {
			output += `${n(imageData.value.width ?? 0)}x${n(imageData.value.height ?? 0)}`;
		}

		if (imageData.value.width !== newDimensions.width || imageData.value.height !== newDimensions.height) {
			if (isSVG) {
				if (newDimensions.width || newDimensions.height) {
					output += ` -> PNG ${n(newDimensions.width ?? 0)}x${n(newDimensions.height ?? 0)}`;
				} else {
					output += ' -> PNG';
				}
			} else {
				output += ` -> ${isSVG ? 'PNG ' : ''}${n(newDimensions.width ?? 0)}x${n(newDimensions.height ?? 0)}`;
			}
		}
	}

	return output;
});

const customAspectRatios = settingsStore.settings?.custom_aspect_ratios ?? null;

function useImage() {
	const loading = ref(false);
	const error = ref(null);
	const imageData = ref<Image | null>(null);
	const saving = ref(false);

	const imageElement = ref<HTMLImageElement | null>(null);

	const hasEdits = computed(() => {
		return (
			!isEqual(
				{ x: 0, y: 0, width: 0, height: 0, rotate: 0, scaleX: 1, scaleY: 1 },
				cropperInstance.value?.getData(),
			) || cropping.value
		);
	});

	return {
		loading,
		error,
		imageData,
		fetchImage,
		imageElement,
		hasEdits,
		save,
		saving,
		onImageLoad,
	};

	async function fetchImage() {
		try {
			loading.value = true;

			const response = await api.get(`/files/${props.id}`, {
				params: {
					fields: imageFields,
				},
			});

			imageData.value = response.data.data;
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function saveImage(focalPoint?: { x: number | null; y: number | null }) {
		// Wrap the callback so that we can actually listen to it
		return new Promise<void>((resolve, reject) => {
			cropperInstance.value
				?.getCroppedCanvas({
					imageSmoothingQuality: 'high',
				})
				.toBlob(async (blob) => {
					if (blob === null) {
						return reject(`Couldn't process and save edited image`);
					}

					const formData = new FormData();

					if (focalPoint) {
						formData.append('focal_point_x' as keyof File, focalPoint.x?.toString() ?? '');
						formData.append('focal_point_y' as keyof File, focalPoint.y?.toString() ?? '');
					}

					formData.append('file', blob, imageData.value?.filename_download);

					api.patch(`/files/${props.id}`, formData).then(
						() => resolve(),
						(err) => reject(err),
					);
				}, imageData.value?.type ?? undefined);
		});
	}

	async function save() {
		if (!hasEdits.value || saving.value) return;

		saving.value = true;

		// Only save focal point if we're also actively selecting it
		const gotChangeForFocalPoint = localDragMode.value === 'focal_point' && cropping.value;

		let focalPointX = null;
		let focalPointY = null;

		// Important: Check focal point first because we must(!) reset the cropping area
		// before saving so that we're not wrongfully cropping
		if (gotChangeForFocalPoint) {
			const data = cropperInstance.value?.getData();
			focalPointX = Math.round((data?.x ?? 0) + (data?.width ?? 0) / 2);
			focalPointY = Math.round((data?.y ?? 0) + (data?.height ?? 0) / 2);
			cropperInstance.value?.clear();
		}

		// Important: This check has to go after(!) we reset the cropping area because
		// `getData` returns info about our focal point, which leads to a false positive
		const gotChangeForImg = !isEqual(
			{ x: 0, y: 0, width: 0, height: 0, rotate: 0, scaleX: 1, scaleY: 1 },
			cropperInstance.value?.getData(),
		);

		// Collapse focal point patch request and image data into one request if we can
		let patchRequest = null;

		if (gotChangeForImg && gotChangeForFocalPoint) {
			patchRequest = saveImage({ x: focalPointX, y: focalPointY });
		} else if (gotChangeForImg) {
			patchRequest = saveImage();
		} else if (gotChangeForFocalPoint) {
			patchRequest = api.patch(`/files/${props.id}`, {
				focal_point_x: focalPointX,
				focal_point_y: focalPointY,
			} satisfies Partial<File>);
		}

		try {
			await patchRequest;
			emit('refresh');
			localDragMode.value = 'move';
			randomId.value = nanoid();
			internalActive.value = false;
		} catch (error) {
			unexpectedError(error);
		} finally {
			saving.value = false;
		}
	}

	async function onImageLoad() {
		await nextTick();
		initCropper();
	}
}

const localDragMode = ref<'move' | 'crop' | 'focal_point'>('move');

function useCropper() {
	const cropperInstance = ref<Cropper | null>(null);

	const localAspectRatio = ref(NaN);

	const newDimensions = reactive({
		width: null as null | number,
		height: null as null | number,
	});

	watch(imageData, () => {
		if (!imageData.value || !imageData.value.width || !imageData.value.height) return;
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
			cropperInstance.value?.crop();
		},
	});

	const aspectRatioIcon = computed(() => {
		if (!imageData.value || !imageData.value.width || !imageData.value.height) return 'crop_original';

		if (customAspectRatios) {
			const customAspectRatio = customAspectRatios.find((customAR) => customAR.value == aspectRatio.value);
			if (customAspectRatio) return 'crop_square';
		}

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

	const dragMode = computed({
		get() {
			return localDragMode.value;
		},
		set(newMode) {
			cropperInstance.value?.setDragMode(newMode === 'move' ? 'move' : 'crop');
			localDragMode.value = newMode;

			if (newMode === 'move') {
				cropperInstance.value?.clear();
				localCropping.value = false;
			} else if (newMode === 'crop') {
				cropperInstance.value?.crop();
			} else if (newMode === 'focal_point') {
				const canvasData = cropperInstance.value?.getCanvasData();
				// Size the box as percentage so that it stays visible for both small and large images
				const boxSize = Math.max(16, (canvasData?.naturalWidth ?? 0) * 0.1);
				let centeredX = 0;
				let centeredY = 0;

				if (imageData.value && imageData.value.focal_point_x !== null && imageData.value.focal_point_y !== null) {
					centeredX = imageData.value.focal_point_x - boxSize / 2;
					centeredY = imageData.value.focal_point_y - boxSize / 2;
				} else {
					centeredX = (canvasData?.naturalWidth ?? 0) / 2 - boxSize / 2;
					centeredY = (canvasData?.naturalHeight ?? 0) / 2 - boxSize / 2;
				}

				aspectRatio.value = 1;
				cropperInstance.value?.setData({ x: centeredX, y: centeredY, width: boxSize, height: boxSize });
			}
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
		reset,
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

		localCropping.value = false;
		localDragMode.value = 'move';

		cropperInstance.value = new Cropper(imageElement.value as HTMLImageElement, {
			autoCrop: false,
			autoCropArea: 0.5,
			toggleDragModeOnDblclick: false,
			dragMode: 'move',
			viewMode: 1,
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

	function reset() {
		cropperInstance.value?.reset();
		dragMode.value = 'move';
	}
}

function setAspectRatio() {
	if (imageData.value && imageData.value.width && imageData.value.height) {
		aspectRatio.value = imageData.value.width / imageData.value.height;
	}
}
</script>

<template>
	<v-drawer
		v-model="internalActive"
		class="modal"
		:title="$t('editing_image')"
		persistent
		@cancel="internalActive = false"
		@apply="save"
	>
		<template #activator="activatorBinding">
			<slot name="activator" v-bind="activatorBinding" />
		</template>

		<template #subtitle>
			<span class="warning">{{ $t('changes_are_permanent') }}</span>
		</template>

		<div v-if="loading" class="loader">
			<v-progress-circular indeterminate />
		</div>

		<v-notice v-else-if="error" type="error">error</v-notice>

		<div
			v-if="imageData && !loading && !error"
			class="editor-container"
			:class="{ 'focal-point': localDragMode === 'focal_point' }"
		>
			<div class="editor">
				<img ref="imageElement" :src="imageURL" role="presentation" alt="" @load="onImageLoad" />
			</div>

			<div class="toolbar">
				<div class="drag-mode toolbar-button">
					<v-icon
						v-tooltip.top.inverted="$t('move_tool')"
						name="pan_tool"
						:class="{ active: localDragMode === 'move' }"
						clickable
						@click="dragMode = 'move'"
					/>
					<v-icon
						v-tooltip.top.inverted="$t('crop_tool')"
						name="crop"
						:class="{ active: localDragMode === 'crop' }"
						clickable
						@click="dragMode = 'crop'"
					/>
					<v-icon
						v-tooltip.top.inverted="$t('focal_point_tool')"
						name="location_searching"
						:class="{ active: localDragMode === 'focal_point' }"
						clickable
						@click="dragMode = 'focal_point'"
					/>
				</div>

				<v-icon v-tooltip.top.inverted="$t('rotate')" name="rotate_90_degrees_ccw" clickable @click="rotate" />

				<v-icon
					v-tooltip.top.inverted="$t('flip_horizontal')"
					name="flip_horizontal"
					clickable
					@click="flip('horizontal')"
				/>

				<v-icon v-tooltip.top.inverted="$t('flip_vertical')" name="flip_vertical" clickable @click="flip('vertical')" />

				<v-menu placement="top" show-arrow>
					<template #activator="{ toggle }">
						<v-icon v-tooltip.top.inverted="$t('aspect_ratio')" :name="aspectRatioIcon" clickable @click="toggle" />
					</template>

					<v-list>
						<template v-if="customAspectRatios">
							<v-list-item
								v-for="customAspectRatio in customAspectRatios"
								:key="customAspectRatio.text"
								clickable
								:active="aspectRatio === customAspectRatio.value"
								@click="aspectRatio = customAspectRatio.value"
							>
								<v-list-item-icon><v-icon name="aspect_ratio" /></v-list-item-icon>
								<v-list-item-content>{{ customAspectRatio.text }}</v-list-item-content>
							</v-list-item>
							<v-divider />
						</template>
						<v-list-item clickable :active="aspectRatio === 16 / 9" @click="aspectRatio = 16 / 9">
							<v-list-item-icon><v-icon name="crop_16_9" /></v-list-item-icon>
							<v-list-item-content>16:9</v-list-item-content>
						</v-list-item>
						<v-list-item clickable :active="aspectRatio === 3 / 2" @click="aspectRatio = 3 / 2">
							<v-list-item-icon><v-icon name="crop_3_2" /></v-list-item-icon>
							<v-list-item-content>3:2</v-list-item-content>
						</v-list-item>
						<v-list-item clickable :active="aspectRatio === 5 / 4" @click="aspectRatio = 5 / 4">
							<v-list-item-icon><v-icon name="crop_5_4" /></v-list-item-icon>
							<v-list-item-content>5:4</v-list-item-content>
						</v-list-item>
						<v-list-item clickable :active="aspectRatio === 7 / 5" @click="aspectRatio = 7 / 5">
							<v-list-item-icon><v-icon name="crop_7_5" /></v-list-item-icon>
							<v-list-item-content>7:5</v-list-item-content>
						</v-list-item>
						<v-list-item clickable :active="aspectRatio === 1 / 1" @click="aspectRatio = 1 / 1">
							<v-list-item-icon><v-icon name="crop_square" /></v-list-item-icon>
							<v-list-item-content>{{ $t('square') }}</v-list-item-content>
						</v-list-item>
						<v-list-item clickable :active="Number.isNaN(aspectRatio)" @click="aspectRatio = NaN">
							<v-list-item-icon><v-icon name="crop_free" /></v-list-item-icon>
							<v-list-item-content>{{ $t('free') }}</v-list-item-content>
						</v-list-item>
						<v-list-item
							v-if="imageData && imageData.width && imageData.height"
							clickable
							:active="aspectRatio === imageData.width / imageData.height"
							@click="setAspectRatio"
						>
							<v-list-item-icon><v-icon name="crop_original" /></v-list-item-icon>
							<v-list-item-content>{{ $t('original') }}</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>

				<div class="spacer" />

				<v-icon v-tooltip.top.inverted="$t('reset')" name="restart_alt" clickable @click="reset" />

				<div v-if="imageData" class="dimensions">
					{{ dimensionsString }}
				</div>

				<button v-show="cropping" class="toolbar-button cancel" type="button" @click="cropping = false">
					{{ localDragMode === 'focal_point' ? $t('cancel_selection') : t('cancel_crop') }}
				</button>
			</div>
		</div>

		<template #actions>
			<v-button v-tooltip.bottom="$t('save')" :loading="saving" icon rounded :disabled="!hasEdits" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<style lang="scss" scoped>
.focal-point:deep(.editor) {
	.cropper-point.point-nw,
	.cropper-point.point-ne,
	.cropper-point.point-se,
	.cropper-point.point-sw,
	.cropper-dashed,
	.cropper-line {
		display: none;
	}

	.cropper-face,
	.cropper-view-box {
		border-radius: 100%;
	}
}

.modal {
	--v-drawer-content-padding-small: 0px;
	--v-drawer-content-padding: 0px;
}

.editor-container {
	inline-size: 100%;
	block-size: calc(100% - (65px + 24px + 24px)); /* header height + 2x margin */
	overflow: hidden;
	background-color: var(--theme--background-subdued);

	.editor {
		flex-grow: 1;
		inline-size: 100%;
		block-size: calc(100% - 60px);
	}

	img {
		/* Cropper JS will handle this */
		opacity: 0;
	}
}

.loader {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 100%;
	block-size: 100%;
}

.toolbar {
	display: flex;
	align-items: center;
	inline-size: 100%;
	block-size: 60px;
	padding: 0 24px;
	color: var(--white);
	background-color: #263238;

	.v-icon {
		display: inline-block;
		margin-inline-end: 16px;
	}
}

.spacer {
	flex-grow: 1;
}

.dimensions {
	margin-inline-end: 12px;
	color: var(--theme--foreground-subdued);
	font-feature-settings: 'tnum';
}

.warning {
	color: var(--theme--warning);
}

.toolbar-button {
	padding: 8px;
	background-color: rgb(255 255 255 / 0.2);
	border-radius: var(--theme--border-radius);
	cursor: pointer;
	transition: background-color var(--fast) var(--transition);

	&:hover {
		background-color: rgb(255 255 255 / 0.15);
	}
}

.drag-mode {
	margin-inline: -8px 16px;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 8px;

	.v-icon {
		margin-inline-end: 0;
		opacity: 0.5;

		&.active {
			opacity: 1;
		}
	}
}

.cancel {
	padding-inline: 16px;
}
</style>
