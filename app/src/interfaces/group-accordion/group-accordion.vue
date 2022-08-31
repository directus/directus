<template>
	<v-item-group v-model="selection" scope="group-accordion" class="group-accordion" :multiple="accordionMode === false">
		<accordion-section
			v-for="accordionField in groupFields"
			:key="accordionField.field"
			:field="accordionField"
			:fields="fields"
			:values="groupValues"
			:initial-values="initialValues"
			:disabled="disabled"
			:batch-mode="batchMode"
			:batch-active-fields="batchActiveFields"
			:primary-key="primaryKey"
			:loading="loading"
			:validation-errors="validationErrors"
			:badge="badge"
			:raw-editor-enabled="rawEditorEnabled"
			:group="field.meta.field"
			:multiple="accordionMode === false"
			:direction="direction"
			@apply="$emit('apply', $event)"
			@toggle-all="toggleAll"
		/>
	</v-item-group>
</template>

<script lang="ts">
import { Field } from '@directus/shared/types';
import { defineComponent, PropType, ref, watch } from 'vue';
import { ValidationError } from '@directus/shared/types';
import AccordionSection from './accordion-section.vue';
import { isEqual } from 'lodash';

export default defineComponent({
	name: 'InterfaceGroupAccordion',
	components: { AccordionSection },
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		values: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		initialValues: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActiveFields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		validationErrors: {
			type: Array as PropType<ValidationError[]>,
			default: () => [],
		},
		badge: {
			type: String,
			default: null,
		},
		rawEditorEnabled: {
			type: Boolean,
			default: false,
		},
		accordionMode: {
			type: Boolean,
			default: true,
		},
		start: {
			type: String,
			enum: ['opened', 'closed', 'first'],
			default: 'closed',
		},
		direction: {
			type: String,
			default: undefined,
		},
	},
	emits: ['apply'],
	setup(props) {
		const selection = ref<string[]>([]);
		const { groupFields, groupValues } = useComputedGroup();

		watch(
			() => props.start,
			(start) => {
				if (start === 'opened') {
					selection.value = groupFields.value.map((field) => field.field);
				}

				if (start === 'first') {
					selection.value = [groupFields.value[0].field];
				}
			},
			{ immediate: true }
		);

		watch(
			() => props.validationErrors,
			(newVal, oldVal) => {
				if (!props.validationErrors) return;
				if (isEqual(newVal, oldVal)) return;
				const includedFieldsWithErrors = props.validationErrors.filter((validationError) =>
					groupFields.value.find((rootField) => rootField.field === validationError.field)
				);
				if (includedFieldsWithErrors.length > 0) selection.value = [includedFieldsWithErrors[0].field];
			}
		);

		return { groupFields, groupValues, selection, toggleAll };

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
			const groupValues = ref<Record<string, any>>({});

			watch(
				() => props.fields,
				() => {
					const newVal = limitFields();
					if (!isEqual(groupFields.value, newVal)) {
						groupFields.value = newVal;
					}
				}
			);
			watch(
				() => props.values,
				(newVal) => {
					if (!isEqual(groupValues.value, newVal)) {
						groupValues.value = newVal;
					}
				}
			);

			return { groupFields, groupValues };

			function limitFields(): Field[] {
				return props.fields.filter((field) => field.meta?.group === props.field.meta?.field);
			}
		}
	},
});
</script>
