<script setup lang="ts">
import type { ContentVersion } from '@directus/types';
import { computed } from 'vue';
import type { ComparisonContext, FormField } from '../types';
import VErrorBoundary from '@/components/v-error-boundary.vue';
import VNotice from '@/components/v-notice.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { useExtension } from '@/composables/use-extension';
import InterfaceSystemRawEditor from '@/interfaces/_system/system-raw-editor/system-raw-editor.vue';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';

const props = defineProps<{
	field: FormField;
	batchMode?: boolean;
	batchActive?: boolean;
	comparison?: ComparisonContext;
	comparisonActive?: boolean;
	primaryKey?: string | number | null;
	modelValue?: string | number | boolean | Record<string, any> | Array<any>;
	loading?: boolean;
	disabled?: boolean;
	nonEditable?: boolean;
	autofocus?: boolean;
	rawEditorEnabled?: boolean;
	rawEditorActive?: boolean;
	direction?: string;
	version?: ContentVersion | null;
}>();

defineEmits(['update:modelValue', 'setFieldValue']);

const inter = useExtension(
	'interface',
	computed(() => props.field?.meta?.interface ?? 'input'),
);

const interfaceExists = computed(() => !!inter.value);

const componentName = computed(() => {
	return props.field?.meta?.interface
		? `interface-${props.field.meta.interface}`
		: `interface-${getDefaultInterfaceForType(props.field.type!)}`;
});

const value = computed(() =>
	props.modelValue === undefined ? (props.field.schema?.default_value ?? null) : props.modelValue,
);
</script>

<template>
	<div
		class="interface"
		:class="{
			subdued: batchMode && batchActive === false,
		}"
	>
		<VSkeletonLoader v-if="loading && field.hideLoader !== true" />

		<VErrorBoundary v-if="interfaceExists && !rawEditorActive" :name="componentName">
			<component
				:is="componentName"
				v-bind="(field.meta && field.meta.options) || {}"
				:autofocus="disabled !== true && autofocus"
				:disabled="disabled"
				:non-editable="nonEditable"
				:loading="loading"
				:value="value"
				:batch-mode="batchMode"
				:batch-active="batchActive"
				:comparison-mode="!!comparison"
				:comparison-active="comparisonActive"
				:comparison-side="comparison?.side"
				:width="(field.meta && field.meta.width) || 'full'"
				:type="field.type"
				:collection="field.collection"
				:field="field.field"
				:field-data="field"
				:primary-key="primaryKey"
				:length="field.schema && field.schema.max_length"
				:direction="direction"
				:raw-editor-enabled="rawEditorEnabled"
				:version
				@input="$emit('update:modelValue', $event)"
				@set-field-value="$emit('setFieldValue', $event)"
			/>

			<template #fallback>
				<VNotice type="warning">{{ $t('unexpected_error') }}</VNotice>
			</template>
		</VErrorBoundary>

		<InterfaceSystemRawEditor
			v-else-if="rawEditorEnabled && rawEditorActive"
			:value="value"
			:type="field.type"
			@input="$emit('update:modelValue', $event)"
		/>

		<VNotice v-else type="warning">
			{{ $t('interface_not_found', { interface: field.meta && field.meta.interface }) }}
		</VNotice>
	</div>
</template>

<style lang="scss" scoped>
.interface {
	position: relative;

	.v-skeleton-loader {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		z-index: 2;
		inline-size: 100%;
		block-size: 100%;
	}

	&.subdued {
		opacity: 0.5;
	}
}
</style>
