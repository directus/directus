<template>
	<ul
		class="v-list"
		:class="{
			dense,
			nav,
			'three-line': lines === 3,
			'two-line': lines === 2,
			'one-line': lines === 1,
		}"
	>
		<slot></slot>
	</ul>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs } from '@vue/composition-api';
import { useGroupableParent } from '@/composables/groupable';

export default defineComponent({
	props: {
		dense: {
			type: Boolean,
			default: false,
		},
		nav: {
			type: Boolean,
			default: false,
		},
		lines: {
			type: Number as PropType<1 | 2 | 3>,
			default: null,
		},
		multiple: {
			type: Boolean,
			default: true,
		},
	},
	setup(props) {
		useGroupableParent(
			{},
			{
				mandatory: ref(false),
				multiple: toRefs(props).multiple,
			}
		);

		return {};
	},
});
</script>

<style>
body {
	--v-list-padding: 4px 0;
	--v-list-max-height: none;
	--v-list-max-width: none;
	--v-list-min-width: 220px;
	--v-list-min-height: none;
	--v-list-color: var(--foreground-normal);
	--v-list-color-hover: var(--foreground-normal);
	--v-list-color-active: var(--foreground-normal);
	--v-list-background-color-hover: var(--background-normal-alt);
	--v-list-background-color-active: var(--background-normal-alt);
}
</style>

<style lang="scss" scoped>
.v-list {
	position: static;
	display: block;
	min-width: var(--v-list-min-width);
	max-width: var(--v-list-max-width);
	min-height: var(--v-list-min-height);
	max-height: var(--v-list-max-height);
	padding: var(--v-list-padding);
	overflow: auto;
	color: var(--v-list-color);
	line-height: 22px;
	border-radius: var(--border-radius);

	&.nav {
		--v-list-padding: 12px;
	}

	::v-deep .v-divider {
		max-width: calc(100% - 16px);
		margin: 8px;
	}
}
</style>
