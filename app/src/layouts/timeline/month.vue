<template>
    <div></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
	props: {
		itemCount: {
			type: Number,
			default: null,
		},
		showingCount: {
			type: String,
			required: true,
		},
	},
});
</script>

<style lang="scss" scoped>

</style>
