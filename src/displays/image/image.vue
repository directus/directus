<template>
	<img v-if="src" :src="src" role="presentation" :alt="value && value.title" :class="{ circle }" />
	<value-null v-else />
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import ValueNull from '@/views/private/components/value-null';

type Image = {
	type: string;
	title: string;
	data: {
		thumbnails: {
			key: string;
			url: string;
		}[];
	};
};

export default defineComponent({
	components: { ValueNull },
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
			return props.value?.data?.thumbnails?.find((thumb) => thumb.key === 'directus-small-crop')?.url || null;
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
