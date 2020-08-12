<template>
	<div
		class="interface"
		:class="{
			subdued: batchMode && batchActive === false,
		}"
	>
		<v-skeleton-loader v-if="loading && field.hideLoader !== true" />

		<component
			v-if="interfaceExists"
			:is="`interface-${field.meta.interface}`"
			v-bind="field.meta.options"
			:disabled="disabled"
			:value="value === undefined ? field.schema.default_value : value"
			:width="field.meta.width"
			:type="field.type"
			:collection="field.collection"
			:field="field.field"
			:primary-key="primaryKey"
			:length="field.length"
			@input="$emit('input', $event)"
		/>

		<v-notice v-else type="warning">
			{{ $t('interface_not_found', { interface: field.interface }) }}
		</v-notice>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Field } from '@/types';
import interfaces from '@/interfaces';

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
	setup(props) {
		const interfaceExists = computed(() => {
			return !!interfaces.find((inter) => inter.id === props.field.meta.interface);
		});

		return { interfaceExists };
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
