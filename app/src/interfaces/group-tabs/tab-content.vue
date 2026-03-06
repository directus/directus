<script setup lang="ts">
import { Field, ValidationError } from '@directus/types';
import { merge } from 'lodash';
import { computed } from 'vue';
import { TabsContent } from 'reka-ui';
import type { ComparisonContext } from '@/components/v-form/types';
import VForm from '@/components/v-form/v-form.vue';
import { CollabContext } from '@/composables/use-collab';
import { getFieldsInGroup } from '@/utils/get-fields-in-group';

const props = withDefaults(
	defineProps<{
		field: Field;
		fields: Field[];
		values: Record<string, unknown>;
		initialValues: Record<string, unknown>;
		disabled?: boolean;
		nonEditable?: boolean;
		batchMode?: boolean;
		batchActiveFields?: string[];
		collabContext?: CollabContext;
		comparison?: ComparisonContext;
		primaryKey: number | string;
		loading?: boolean;
		validationErrors?: ValidationError[];
		rawEditorEnabled?: boolean;
		group: string;
		direction?: string;
	}>(),
	{
		batchActiveFields: () => [],
		validationErrors: () => [],
	},
);

defineEmits<{
	(e: 'apply', value: Record<string, unknown>): void;
}>();

const fieldsInSection = computed(() => {
	const fields: Field[] = [merge({}, props.field, { hideLabel: true })];

	if (props.field.meta?.special?.includes('group')) {
		fields.push(...getFieldsInGroup(props.field.field, props.fields));
	}

	return fields;
});
</script>

<template>
	<TabsContent :value="field.field" class="tab-content">
		<VForm
			:initial-values="initialValues"
			:fields="fieldsInSection"
			:model-value="values"
			:primary-key="primaryKey"
			:group="group"
			:validation-errors="validationErrors"
			:loading="loading"
			:batch-mode="batchMode"
			:disabled="disabled"
			:non-editable="nonEditable"
			:comparison="comparison"
			:collab-context="collabContext"
			:direction="direction"
			:show-no-visible-fields="false"
			:show-validation-errors="false"
			@update:model-value="$emit('apply', $event)"
		/>
	</TabsContent>
</template>

<style lang="scss" scoped>
.tab-content {
	padding-block-start: var(--theme--form--row-gap);
}
</style>
