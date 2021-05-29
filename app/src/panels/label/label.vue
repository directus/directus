<template>
	<div class="label type-title selectable" :class="{ 'has-header': show_header }" :style="{ color: options.color }">
		{{ options.text }}
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		options: {
			type: Object,
			default: null,
		},
		show_header: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style scoped>
.label {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	font-weight: 800;
	font-size: 42px;
	line-height: 52px;
}

.label.has-header {
	height: calc(100% - 24px);
}
</style>
