<template>
	<span v-if="!value" />
	<v-icon name="help_outline" v-else-if="!status" />
	<div
		v-else
		class="badge type-text"
		:style="{
			backgroundColor: status.background_color,
			color: status.text_color,
		}"
	>
		{{ status.name }}
	</div>
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
.badge {
	display: inline-block;
	padding: 8px;
	color: var(--foreground-inverted);
	line-height: 1;
	vertical-align: middle;
	border-radius: var(--border-radius);
}
</style>
