<template>
	<v-icon small :name="value" :style="style" :filled="filled" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { isHex } from '@/utils/is-hex';

export default defineComponent({
	name: 'DisplayIcon',
	props: {
		value: {
			type: String,
			default: null,
		},
		color: {
			type: String,
			default: null,
		},
		filled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const style = computed(() => {
			if (isHex(props.color)) return { '--v-icon-color': props.color };
			else return {};
		});

		return { style };
	},
});
</script>
