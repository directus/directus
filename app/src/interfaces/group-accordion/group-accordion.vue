<script setup lang="ts">
import type { ComparisonContext } from '@/components/v-form/types';
import VItemGroup from '@/components/v-item-group.vue';
import { Field, ValidationError } from '@directus/types';
import { isEqual } from 'lodash';
import { ref, watch } from 'vue';
import AccordionSection from './accordion-section.vue';

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
		comparison?: ComparisonContext;
		primaryKey: string | number;
		loading?: boolean;
		validationErrors?: ValidationError[];
		badge?: string;
		rawEditorEnabled?: boolean;
		accordionMode?: boolean;
		start?: 'opened' | 'closed' | 'first';
		direction?: string;
	}>(),
	{
		batchActiveFields: () => [],
		validationErrors: () => [],
		accordionMode: true,
		start: 'closed',
	},
);

defineEmits<{
	(e: 'apply', value: Record<string, unknown>): void;
}>();

const selection = ref<string[]>([]);
const { groupFields, groupValues } = useComputedGroup();

watch(
	() => props.start,
	(start) => {
		if (start === 'opened') {
			selection.value = groupFields.value.map((field) => field.field);
		}

		if (start === 'first') {
			selection.value = [groupFields.value[0]!.field];
		}
	},
	{ immediate: true },
);

watch(
	() => props.validationErrors,
	(newVal, oldVal) => {
		if (!props.validationErrors) return;
		if (isEqual(newVal, oldVal)) return;

		const includedFieldsWithErrors = props.validationErrors.filter((validationError) =>
			groupFields.value.find((rootField) => rootField.field === validationError.field),
		);

		if (includedFieldsWithErrors.length > 0)
			selection.value = [(includedFieldsWithErrors as [ValidationError])[0].field];
	},
);

function toggleAll() {
	if (props.accordionMode === true) return;

	if (selection.value.length === groupFields.value.length) {
		selection.value = [];
	} else {
		selection.value = groupFields.value.map((field) => field.field);
	}
}

function useComputedGroup() {
	const groupFields = ref<Field[]>(limitFields());
	const groupValues = ref<Record<string, any>>(props.values);

	watch(
		() => props.fields,
		() => {
			const newVal = limitFields();

			if (!isEqual(groupFields.value, newVal)) {
				groupFields.value = newVal;
			}
		},
	);

	watch(
		() => props.values,
		(newVal) => {
			if (!isEqual(groupValues.value, newVal)) {
				groupValues.value = newVal;
			}
		},
	);

	return { groupFields, groupValues };

	function limitFields(): Field[] {
		return props.fields.filter((field) => field.meta?.group === props.field.meta?.field);
	}
}
</script>

<template>
	<VItemGroup v-model="selection" scope="group-accordion" class="group-accordion" :multiple="accordionMode === false">
		<AccordionSection
			v-for="accordionField in groupFields"
			:key="accordionField.field"
			:field="accordionField"
			:fields="fields"
			:values="groupValues"
			:initial-values="initialValues"
			:disabled="disabled"
			:non-editable="nonEditable"
			:batch-mode="batchMode"
			:batch-active-fields="batchActiveFields"
			:comparison="comparison"
			:primary-key="primaryKey"
			:loading="loading"
			:validation-errors="validationErrors"
			:badge="badge"
			:raw-editor-enabled="rawEditorEnabled"
			:group="field.meta!.field"
			:multiple="accordionMode === false"
			:direction="direction"
			@apply="$emit('apply', $event)"
			@toggle-all="toggleAll"
		/>
	</VItemGroup>
</template>

<style lang="scss" scoped>
.group-accordion {
	border-block-end: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
}
</style>
