<template>
	<div
		class="interface"
		:class="{
			subdued: batchMode && batchActive === false,
		}"
	>
		<v-skeleton-loader v-if="loading && field.hideLoader !== true" />

		<component
			:is="
				field.meta && field.meta.interface
					? `interface-${field.meta.interface}`
					: `interface-${getDefaultInterfaceForType(field.type)}`
			"
			v-if="interfaceExists"
			v-bind="(field.meta && field.meta.options) || {}"
			:autofocus="disabled !== true && autofocus"
			:disabled="disabled"
			:loading="loading"
			:value="modelValue === undefined ? field.schema?.default_value : modelValue"
			:width="(field.meta && field.meta.width) || 'full'"
			:type="field.type"
			:collection="field.collection"
			:field="field.field"
			:field-data="field"
			:primary-key="primaryKey"
			:length="field.schema && field.schema.max_length"
			@input="$emit('update:modelValue', $event)"
		/>

		<v-notice v-else type="warning">
			{{ t('interface_not_found', { interface: field.meta && field.meta.interface }) }}
		</v-notice>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { Field } from '@directus/shared/types';
import { getInterface } from '@/interfaces';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';

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
		modelValue: {
			type: [String, Number, Object, Array, Boolean],
			default: undefined,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		autofocus: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props) {
		const { t } = useI18n();

		const interfaceExists = computed(() => !!getInterface(props.field?.meta?.interface || 'input'));

		return { t, interfaceExists, getDefaultInterfaceForType };
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
