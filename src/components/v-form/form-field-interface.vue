<template>
	<div
		class="interface"
		:class="{
			subdued: batchMode && batchActive,
		}"
	>
		<v-skeleton-loader v-if="loading && field.hideLoader !== true" />
		<component
			:is="`interface-${field.interface}`"
			v-bind="field.options"
			:disabled="disabled"
			:value="value === undefined ? field.default_value : value"
			:width="field.width"
			:type="field.type"
			:collection="field.collection"
			:field="field.field"
			:primary-key="primaryKey"
			@input="$emit('input', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Field } from '@/stores/fields/types';

export default defineComponent({
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActive: {
			type: Boolean,
			default: false,
		},
		primaryKey: {
			type: [Number, String],
			default: null,
		},
		value: {
			type: [String, Number, Object, Array, Boolean],
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style lang="scss" scoped>
.interface {
	position: relative;

	.v-skeleton-loader {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 2;
		width: 100%;
		height: 100%;
	}

	&.subdued {
		opacity: 0.5;
	}
}
</style>
