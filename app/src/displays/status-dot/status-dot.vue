<template>
	<span v-if="!value" />
	<v-icon name="help_outline" small v-else-if="!status" />
	<div
		v-else
		class="dot"
		v-tooltip="status.name"
		:style="{
			backgroundColor: status.background_color,
		}"
	/>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		interfaceOptions: {
			type: Object,
			default: null,
		},
	},
	setup(props) {
		const status = computed(() => {
			if (props.interfaceOptions === null) return null;

			return props.interfaceOptions.status_mapping?.[props.value];
		});

		return { status };
	},
});
</script>

<style lang="scss" scoped>
.dot {
	display: inline-block;
	flex-shrink: 0;
	width: 12px;
	height: 12px;
	margin: 0 4px;
	vertical-align: middle;
	border-radius: 6px;
}
</style>
