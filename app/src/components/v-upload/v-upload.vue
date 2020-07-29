<template>
	<div
		data-dropzone
		class="v-upload"
		:class="{ dragging, uploading }"
		@dragenter.prevent="onDragEnter"
		@dragover.prevent
		@dragleave.prevent="onDragLeave"
		@drop.stop.prevent="onDrop"
	>
		<template v-if="dragging">
			<p class="type-label">{{ $t('drop_to_upload') }}</p>
			<p class="type-text">{{ $t('upload_pending') }}</p>
		</template>

		<template v-else-if="uploading">
			<p class="type-label">{{ progress }}%</p>
			<p class="type-text">{{ $t('upload_file_indeterminate') }}</p>
			<v-progress-linear :value="progress" rounded />
		</template>

		<template v-else>
			<p class="type-label">{{ $t('drag_file_here') }}</p>
			<p class="type-text">{{ $t('click_to_browse') }}</p>
			<input class="browse" type="file" @input="onBrowseSelect" />
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import uploadFile from '@/utils/upload-file';

export default defineComponent({
	props: {},
	setup(props, { emit }) {
		const { uploading, progress, error, upload, onBrowseSelect } = useUpload();
		const { onDragEnter, onDragLeave, onDrop, dragging } = useDragging();

		return {
			uploading,
			progress,
			error,
			onDragEnter,
			onDragLeave,
			onDrop,
			dragging,
			onBrowseSelect,
		};

		function useUpload() {
			const uploading = ref(false);
			const progress = ref(0);
			const error = ref(null);

			return { uploading, progress, error, upload, onBrowseSelect };

			async function upload(file: File) {
				uploading.value = true;
				progress.value = 0;

				try {
					const response = await uploadFile(file, (percentage) => {
						progress.value = percentage;
					});

					if (response) {
						emit('upload', response.data.data);
					}
				} catch (err) {
					console.error(err);
					error.value = err;
				} finally {
					uploading.value = false;
				}
			}

			function onBrowseSelect(event: InputEvent) {
				const file = (event.target as HTMLInputElement)?.files?.[0];

				if (file) {
					upload(file);
				}
			}
		}

		function useDragging() {
			const dragging = ref(false);

			let dragCounter = 0;

			return { onDragEnter, onDragLeave, onDrop, dragging };

			function onDragEnter() {
				dragCounter++;

				if (dragCounter === 1) {
					dragging.value = true;
				}
			}

			function onDragLeave() {
				dragCounter--;

				if (dragCounter === 0) {
					dragging.value = false;
				}
			}

			function onDrop(event: DragEvent) {
				dragCounter = 0;
				dragging.value = false;

				const file = event.dataTransfer?.files[0];

				if (file) {
					upload(file);
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-upload {
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-height: var(--input-height-tall);
	padding: 32px;
	color: var(--foreground-subdued);
	text-align: center;
	border: 2px dashed var(--border-normal);
	border-radius: var(--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: color, border-color, background-color;

	p {
		color: inherit;
	}

	&:hover {
		color: var(--primary);
		border-color: var(--primary);
	}
}

.browse {
	position: absolute;
	top: 0;
	left: 0;
	display: block;
	width: 100%;
	height: 100%;
	cursor: pointer;
	opacity: 0;
	appearance: none;
}

.dragging {
	color: var(--primary);
	background-color: var(--primary-alt);
	border-color: var(--primary);

	* {
		pointer-events: none;
	}
}

.uploading {
	--v-progress-linear-color: var(--white);
	--v-progress-linear-background-color: rgb(255 255 255 / 25%);
	--v-progress-linear-height: 8px;

	color: var(--white);
	background-color: var(--primary);
	border-color: var(--primary);
	border-style: solid;

	.v-progress-linear {
		position: absolute;
		bottom: 30px;
		left: 32px;
		width: calc(100% - 64px);
	}
}
</style>
