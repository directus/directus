<template>
	<v-icon v-if="imageError" name="image" />
	<v-image
		v-else-if="src"
		:src="src"
		role="presentation"
		:alt="value && value.title"
		:class="{ circle }"
		@error="imageError = true"
	/>
	<value-null v-else />
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';

type Image = {
	id: string;
	type: string;
	title: string;
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
		const imageError = ref(false);

		const src = computed(() => {
			if (props.value?.id === null || props.value?.id === undefined) return null;
			return `/assets/${props.value.id}?key=system-small-cover`;
		});

		return { src, imageError };
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
