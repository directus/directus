<template>
	<ul class="v-list" :class="{ dense, nav }">
		<slot></slot>
	</ul>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';

export default createComponent({
	props: {
		dense: {
			type: Boolean,
			default: false
		},
		nav: {
			type: Boolean,
			default: false
		}
	},
	setup() {
		return {};
	}
});
</script>

<style lang="scss" scoped>
.v-list {
	--v-list-padding: 8px 0;
	--v-list-max-height: none;
	--v-list-max-width: none;
	--v-list-min-width: none;
	--v-list-min-height: none;
	--v-list-color: var(--foreground-color);
	--v-list-color-hover: var(--foreground-color);
	--v-list-color-active: var(--foreground-color);
	--v-list-background-color: var(--background-color);
	--v-list-background-color-hover: var(--background-color-hover);
	--v-list-background-color-active: var(--background-color-active);

	width: 100%;
	min-width: var(--v-list-min-width);
	max-width: var(--v-list-max-width);
	min-height: var(--v-list-min-height);
	max-height: var(--v-list-max-height);
	padding: var(--v-list-padding);
	overflow: auto;
	color: var(--v-list-color);
	background-color: var(--v-list-background-color);
	border-radius: var(--input-border-radius);

	&.nav {
		--v-list-padding: 8px;
	}
}
</style>
