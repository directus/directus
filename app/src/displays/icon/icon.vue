<template>
	<v-icon small :name="value" :style="style" />
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { isHex } from '@/utils/color';

export default defineComponent({
	name: 'display-icon',
	props: {
		value: {
			type: String,
			default: null,
		},
		color: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const style = computed(() => {
			console.log(props.color, isHex(props.color));

			if (isHex(props.color)) return { '--v-icon-color': props.color };
			else return {};
		});

		return { style };
	},
});
</script>
