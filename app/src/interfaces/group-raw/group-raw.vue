<script setup lang="ts">
import { Field, ValidationError } from '@directus/types';
import type { ComparisonContext } from '@/components/v-form/types';

withDefaults(
	defineProps<{
		field: Field;
		fields: Field[];
		values: Record<string, unknown>;
		initialValues: Record<string, unknown>;
		primaryKey: number | string;
		disabled?: boolean;
		nonEditable?: boolean;
		batchMode?: boolean;
		batchActiveFields?: string[];
		comparison?: ComparisonContext;
		loading?: boolean;
		validationErrors?: ValidationError[];
		badge?: string;
		rawEditorEnabled?: boolean;
		direction?: string;
	}>(),
	{
		batchActiveFields: () => [],
		validationErrors: () => [],
	},
);

defineEmits(['apply']);
</script>

<template>
	<div class="group-raw">
		<v-form
			:initial-values="initialValues"
			:fields="fields"
			:model-value="values"
			:primary-key="primaryKey"
			:group="field.meta?.field"
			:validation-errors="validationErrors"
			:loading="loading"
			:batch-mode="batchMode"
			:non-editable="nonEditable"
			:disabled="disabled"
			:comparison="comparison"
			:badge="badge"
			:raw-editor-enabled="rawEditorEnabled"
			:direction="direction"
			:show-no-visible-fields="false"
			:show-validation-errors="false"
			@update:model-value="$emit('apply', $event)"
		/>
	</div>
</template>
