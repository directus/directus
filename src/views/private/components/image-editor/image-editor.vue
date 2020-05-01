<template>
	<v-modal v-model="_active" class="modal" :title="$t('editing_image')" persistent no-padding>
		<template #activator="activatorBinding">
			<slot name="activator" v-bind="activatorBinding" />
		</template>

		<template #header:append>
			<span class="warning">{{ $t('changes_are_immediate_and_permanent') }}</span>
		</template>

		<div class="loader" v-if="loading">
			<v-progress-circular indeterminate />
		</div>

		<v-notice type="error" v-else-if="error">
			error
		</v-notice>

		<div
			v-show="imageData && imageData.data.full_url && !loading && !error"
			class="editor-container"
		>
			<div class="editor">
				<img
					ref="imageElement"
					:src="imageURL"
					role="presentation"
					alt=""
					@load="onImageLoad"
				/>
			</div>

			<div class="toolbar">
				<v-icon name="rotate_90_degrees_ccw" @click="rotate" v-tooltip.top="$t('rotate')" />
				<v-icon
					name="flip_horizontal"
					@click="flip('horizontal')"
					v-tooltip.top="$t('flip_horizontal')"
				/>
				<v-icon
					name="flip_vertical"
					@click="flip('vertical')"
					v-tooltip.top="$t('flip_vertical')"
				/>
				<v-menu
					placement="top"
					show-arrow
					close-on-content-click
					v-tooltip.top="$t('aspect_ratio')"
				>
					<template #activator="{ toggle }">
						<v-icon :name="aspectRatioIcon" @click="toggle" />
					</template>

					<v-list dense>
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
					</v-list>
				</v-menu>
			</div>
		</div>

		<template #footer="{ close }">
			<v-button @click="close" secondary>{{ $t('cancel') }}</v-button>
			<v-button @click="save" :loading="saving">{{ $t('save') }}</v-button>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from '@vue/composition-api';
import api from '@/api';
import useProjectsStore from '@/stores/projects';
import Cropper from 'cropperjs';
import { nanoid } from 'nanoid';

type Image = {
	type: string;
	data: {
		full_url: string;
	};
	filesize: number;
	filename_download: string;
};

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		id: {
			type: Number,
			required: true,
		},
		active: {
			type: Boolean,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const projectsStore = useProjectsStore();

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

		const {
			loading,
			error,
			imageData,
			imageElement,
			save,
			saving,
			fetchImage,
			onImageLoad,
		} = useImage();

		const {
			cropperInstance,
			initCropper,
			flip,
			rotate,
			aspectRatio,
			aspectRatioIcon,
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
			return imageData && imageData.value && imageData.value.data.full_url + '?' + nanoid();
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
		};

		function useImage() {
			const loading = ref(false);
			const error = ref(null);
			const imageData = ref<Image>(null);
			const saving = ref(false);

			const imageElement = ref<HTMLImageElement>(null);

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
				const { currentProjectKey } = projectsStore.state;

				try {
					loading.value = true;
					const response = await api.get(`/${currentProjectKey}/files/${props.id}`, {
						params: {
							fields: ['data', 'type', 'filesize', 'filename_download'],
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
				const { currentProjectKey } = projectsStore.state;
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
							await api.post(`/${currentProjectKey}/files/${props.id}`, formData);
							emit('refresh');
							_active.value = false;
						} catch (err) {
							console.error(err);
						} finally {
							saving.value = false;
						}
					}, imageData.value?.type);
			}

			function onImageLoad() {
				initCropper();
			}
		}

		function useCropper() {
			const cropperInstance = ref<Cropper>(null);

			const localAspectRatio = ref(NaN);

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
					case NaN:
					default:
						return 'crop_free';
				}
			});

			return { cropperInstance, initCropper, flip, rotate, aspectRatio, aspectRatioIcon };

			function initCropper() {
				if (imageElement.value === null) return;

				if (cropperInstance.value) {
					cropperInstance.value.destroy();
				}

				cropperInstance.value = new Cropper(imageElement.value);
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
	--v-modal-content-padding-small: 0px;
	--v-modal-content-padding: 0px;
}

.editor-container {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background-color: var(--background-subdued);

	.editor {
		flex-grow: 1;
		width: 100%;
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
	justify-content: center;
	width: 100%;
	height: 60px;
	color: var(--white);
	background-color: #263238;

	> * {
		display: inline-block;
		margin: 0 8px;
	}
}

.warning {
	color: var(--warning);
}
</style>
