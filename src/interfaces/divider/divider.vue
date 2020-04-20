<template>
	<v-divider
		full-width
		:style="{
			'--v-divider-color': color,
		}"
	/>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		color: {
			type: String,
			default: null,
		},
	},
});
</script>
