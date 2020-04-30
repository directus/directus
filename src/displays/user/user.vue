<template>
	<span v-if="display === 'name'">{{ value.first_name }} {{ value.last_name }}</span>
	<img
		v-else-if="display === 'avatar' && src"
		:src="src"
		role="presentation"
		:alt="value && `${value.first_name} ${value.last_name}`"
	/>
	<img
		v-else-if="display === 'avatar' && src === null"
		src="../../assets/avatar-placeholder.svg"
		role="presentation"
		:alt="value && `${value.first_name} ${value.last_name}`"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';

type User = {
	id: number;
	avatar: {
		data: {
			thumbnails: {
				key: string;
				url: string;
			}[];
		};
	};
	first_name: string;
	last_name: string;
};

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<User>,
			default: null,
		},
		display: {
			type: String as PropType<'avatar' | 'name'>,
			default: 'avatar',
		},
	},
	setup(props) {
		const src = computed(() => {
			if (props.value === null) return null;
			return (
				props.value?.avatar?.data?.thumbnails?.find(
					(thumb) => thumb.key === 'directus-small-crop'
				)?.url || null
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
	border-radius: 4px;
}
</style>
