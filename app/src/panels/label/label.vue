<template>
	<div class="label type-title selectable" :class="{ 'has-header': showHeader }" :style="{ color: color }">
		{{ text }}
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},

		text: {
			type: String,
			default: '',
		},
		color: {
			type: String,
			default: undefined,
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
