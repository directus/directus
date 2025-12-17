<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import { getAssetUrl } from '@/utils/get-asset-url';
import ValueNull from '@/views/private/components/value-null.vue';
import { computed, ref } from 'vue';

type Image = {
	id: string;
	type: string;
	title: string;
	modified_on: Date;
};

const props = defineProps<{
	value: Image | null;
	circle?: boolean;
}>();

const imageError = ref(false);

const src = computed(() => {
	if (props.value?.id === null || props.value?.id === undefined) return null;

	return getAssetUrl(props.value.id, {
		imageKey: 'system-small-cover',
		cacheBuster: props.value.modified_on,
	});
});
</script>

<template>
	<VIcon v-if="imageError" name="image" />
	<VImage
		v-else-if="src"
		:src="src"
		role="presentation"
		:alt="value && value.title"
		:class="{ circle }"
		@error="imageError = true"
	/>
	<ValueNull v-else />
</template>

<style lang="scss" scoped>
img {
	display: inline-block;
	inline-size: auto;
	block-size: 100%;
	vertical-align: -30%;
	border-radius: var(--theme--border-radius);

	&.circle {
		border-radius: 100%;
		aspect-ratio: 1;
	}
}
</style>
