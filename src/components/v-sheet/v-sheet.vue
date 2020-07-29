<template>
	<div class="v-sheet">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {},
	setup() {
		return {};
	},
});
</script>

<style>
body {
	--v-sheet-background-color: var(--background-subdued);
	--v-sheet-height: auto;
	--v-sheet-min-height: var(--input-height);
	--v-sheet-max-height: none;
	--v-sheet-width: auto;
	--v-sheet-min-width: none;
	--v-sheet-max-width: none;
	--v-sheet-padding: 8px;
}
</style>

<style lang="scss" scoped>
.v-sheet {
	width: var(--v-sheet-width);
	min-width: var(--v-sheet-min-width);
	max-width: var(--v-sheet-max-width);
	height: var(--v-sheet-height);
	min-height: var(--v-sheet-min-height);
	max-height: var(--v-sheet-max-height);
	padding: var(--v-sheet-padding);
	overflow: auto;
	background-color: var(--v-sheet-background-color);
	border-radius: var(--border-radius);
}
</style>
