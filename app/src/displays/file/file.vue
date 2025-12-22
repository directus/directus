<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import { getAssetUrl } from '@/utils/get-asset-url';
import { readableMimeType } from '@/utils/readable-mime-type';
import { computed, ref } from 'vue';

type File = {
	id: string;
	type: string;
	title: string;
	modified_on: Date;
};

const props = withDefaults(
	defineProps<{
		value?: File | null;
	}>(),
	{
		value: null,
	},
);

const previewEl = ref<Element>();
const imgError = ref(false);

const fileExtension = computed(() => {
	if (!props.value) return null;
	return readableMimeType(props.value.type, true);
});

const imageThumbnail = computed(() => {
	if (!props.value) return null;
	if (props.value.type?.includes('svg')) return getAssetUrl(props.value.id);
	if (props.value.type?.includes('image') === false) return null;

	return getAssetUrl(props.value.id, {
		imageKey: 'system-small-cover',
		cacheBuster: props.value.modified_on,
	});
});
</script>

<template>
	<VImage
		v-if="imageThumbnail && !imgError"
		:src="imageThumbnail"
		:class="{ 'is-svg': value && value.type?.includes('svg') }"
		:alt="value?.title"
		@error="imgError = true"
	/>
	<div v-else ref="previewEl" class="preview">
		<span v-if="fileExtension" class="extension">
			{{ fileExtension }}
		</span>

		<VIcon v-else name="folder_open" />
	</div>
</template>

<style lang="scss" scoped>
img {
	block-size: 100%;
	object-fit: cover;
	border-radius: var(--theme--border-radius);
	aspect-ratio: 1;
}

.preview {
	--v-icon-color: var(--theme--foreground-subdued);

	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	block-size: 100%;
	overflow: hidden;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	aspect-ratio: 1;

	&.has-file {
		background-color: var(--theme--primary-background);
	}
}

.extension {
	color: var(--theme--primary);
	font-weight: 600;
	font-size: 11px;
	text-transform: uppercase;
}
</style>
