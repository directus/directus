<template>
	<div
		class="interface"
		:class="{
			subdued: batchMode && batchActive === false,
		}"
	>
		<v-skeleton-loader v-if="loading && field.hideLoader !== true" />

		<v-error-boundary v-if="interfaceExists && !rawEditorActive" :name="componentName">
			<component
				:is="componentName"
				v-bind="(field.meta && field.meta.options) || {}"
				:autofocus="disabled !== true && autofocus"
				:disabled="disabled"
				:loading="loading"
				:value="value"
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

			<template #fallback>
				<v-notice type="warning">{{ t('unexpected_error') }}</v-notice>
			</template>
		</v-error-boundary>

		<interface-system-raw-editor
			v-else-if="rawEditorEnabled && rawEditorActive"
			:value="value"
			:type="field.type"
			@input="$emit('update:modelValue', $event)"
		/>

		<v-notice v-else type="warning">
			{{ t('interface_not_found', { interface: field.meta && field.meta.interface }) }}
		</v-notice>
	</div>
</template>

<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormField } from './types';

const props = defineProps<{
	field: FormField;
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
}>();

defineEmits(['update:modelValue', 'setFieldValue']);

const { t } = useI18n();

const inter = useExtension(
	'interface',
	computed(() => props.field?.meta?.interface ?? 'input')
);

const interfaceExists = computed(() => !!inter.value);

const componentName = computed(() => {
	return props.field?.meta?.interface
		? `interface-${props.field.meta.interface}`
		: `interface-${getDefaultInterfaceForType(props.field.type!)}`;
});

const value = computed(() =>
	props.modelValue === undefined ? props.field.schema?.default_value ?? null : props.modelValue
);
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
