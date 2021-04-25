<template>
	<img v-if="src" :src="src" role="presentation" :alt="value && value.title" :class="{ circle }" />
	<value-null v-else />
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import ValueNull from '@/views/private/components/value-null';
import { getRootPath } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';

type Image = {
	id: string;
	type: string;
	title: string;
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
			const url = getRootPath() + `assets/${props.value.id}?key=system-small-cover`;

			return addTokenToURL(url);
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
