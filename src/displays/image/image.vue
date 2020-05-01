<template>
	<img
		v-if="src"
		:src="src"
		role="presentation"
		:alt="value && value.title"
		:class="{ circle }"
	/>
	<span v-else>--</span>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';

type Image = {
	type: string;
	data: {
		thumbnails: {
			key: string;
			url: string;
		}[];
	};
};

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<Image>,
			default: null,
		},
		circle: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const src = computed(() => {
			if (props.value === null) return null;
			return (
				props.value?.data?.thumbnails?.find((thumb) => thumb.key === 'directus-small-crop')
					?.url || null
			);
		});

		return { src };
	},
});
</script>

<style lang="scss" scoped>
img {
	display: inline-block;
	width: auto;
	height: 100%;
	vertical-align: -30%;
	border-radius: var(--border-radius);

	&.circle {
		border-radius: 100%;
	}
}
</style>
