<template>
	<v-item-group v-model="selection" scope="group-accordion" class="group-accordion" :multiple="accordionMode === false">
		<accordion-section
			v-for="accordionField in rootFields"
			:key="accordionField.field"
			:field="accordionField"
			:fields="fields"
			:values="values"
			:initial-values="initialValues"
			:disabled="disabled"
			:batch-mode="batchMode"
			:batch-active-fields="batchActiveFields"
			:primary-key="primaryKey"
			:loading="loading"
			:validation-errors="validationErrors"
			:group="field.meta.field"
			:multiple="accordionMode === false"
			@apply="$emit('apply', $event)"
			@toggleAll="toggleAll"
		/>
	</v-item-group>
</template>

<script lang="ts">
import { Field } from '@directus/shared/types';
import { defineComponent, PropType, computed, ref, watch } from 'vue';
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

		accordionMode: {
			type: Boolean,
			default: true,
		},
		start: {
			type: String,
			enum: ['opened', 'closed', 'first'],
			default: 'closed',
		},
	},
	emits: ['apply'],
	setup(props) {
		const rootFields = computed(() => {
			return props.fields.filter((field) => field.meta?.group === props.field.meta?.field);
		});

		const selection = ref<string[]>([]);

		watch(
			() => props.start,
			(start) => {
				if (start === 'opened') {
					selection.value = rootFields.value.map((field) => field.field);
				}

				if (start === 'first') {
					selection.value = [rootFields.value[0].field];
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
					rootFields.value.find((rootField) => rootField.field === validationError.field)
				);
				if (includedFieldsWithErrors.length > 0) selection.value = [includedFieldsWithErrors[0].field];
			}
		);

		return { rootFields, selection, toggleAll };

		function toggleAll() {
			if (props.accordionMode === true) return;

			if (selection.value.length === rootFields.value.length) {
				selection.value = [];
			} else {
				selection.value = rootFields.value.map((field) => field.field);
			}
		}
	},
});
</script>
