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
			v-if="interfaceExists && !rawEditorActive"
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
			:direction="direction"
			@input="$emit('update:modelValue', $event)"
			@set-field-value="$emit('setFieldValue', $event)"
		/>

		<interface-system-raw-editor
			v-else-if="rawEditorEnabled && rawEditorActive"
			:value="modelValue === undefined ? field.schema?.default_value : modelValue"
			:type="field.type"
			@input="$emit('update:modelValue', $event)"
		/>

		<v-notice v-else type="warning">
			{{ t('interface_not_found', { interface: field.meta && field.meta.interface }) }}
		</v-notice>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { Field } from '@directus/shared/types';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { useExtension } from '@/composables/use-extension';

interface Props {
	field: Field;
	batchMode?: boolean;
	batchActive?: boolean;
	primaryKey?: string | number | null;
	modelValue?: string | number | boolean | Record<string, any> | Array<any>;
	loading?: boolean;
	disabled?: boolean;
	autofocus?: boolean;
	rawEditorEnabled?: boolean;
	rawEditorActive?: boolean;
	direction?: string;
}

const props = withDefaults(defineProps<Props>(), {
	batchMode: false,
	batchActive: false,
	primaryKey: null,
	modelValue: undefined,
	loading: false,
	disabled: false,
	autofocus: false,
	rawEditorEnabled: false,
	rawEditorActive: false,
	direction: undefined,
});

defineEmits(['update:modelValue', 'setFieldValue']);

const { t } = useI18n();

const inter = useExtension(
	'interface',
	computed(() => props.field?.meta?.interface ?? 'input')
);

const interfaceExists = computed(() => !!inter.value);
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
