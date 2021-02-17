<template>
	<div class="v-form" ref="el" :class="gridClass">
		<v-notice type="danger" v-if="unknownValidationErrors.length > 0" class="full">
			<div>
				<p>{{ $t('unknown_validation_errors') }}</p>
				<ul>
					<li v-for="(validationError, index) of unknownValidationErrors" :key="index">
						<strong>{{ validationError.field }}</strong>
						: {{ $t(`validationError.${validationError.type}`, validationError) }}
					</li>
				</ul>
			</div>
		</v-notice>

		<form-field
			v-for="field in formFields"
			:field="field"
			:key="field.field"
			:value="(edits || {})[field.field]"
			:initial-value="(initialValues || {})[field.field]"
			:disabled="disabled"
			:batch-mode="batchMode"
			:batch-active="batchActiveFields.includes(field.field)"
			:primary-key="primaryKey"
			:loading="loading"
			:validation-error="validationErrors.find((err) => err.field === field.field)"
			@input="setValue(field, $event)"
			@unset="unsetValue(field)"
			@toggle-batch="toggleBatchField(field)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, provide } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/';
import { Field } from '@/types';
import { useElementSize } from '@/composables/use-element-size';
import { clone, cloneDeep } from 'lodash';
import marked from 'marked';
import FormField from './form-field.vue';
import useFormFields from '@/composables/use-form-fields';
import { ValidationError } from './types';

type FieldValues = {
	[field: string]: any;
};

export default defineComponent({
	components: { FormField },
	model: {
		prop: 'edits',
	},
	props: {
		collection: {
			type: String,
			default: undefined,
		},
		fields: {
			type: Array as PropType<Field[]>,
			default: undefined,
		},
		initialValues: {
			type: Object as PropType<FieldValues>,
			default: null,
		},
		edits: {
			type: Object as PropType<FieldValues>,
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		// Note: can be null when the form is used in batch mode
		primaryKey: {
			type: [String, Number],
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		validationErrors: {
			type: Array as PropType<ValidationError[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const el = ref<Element>();
		const fieldsStore = useFieldsStore();

		const values = computed(() => {
			return Object.assign({}, props.initialValues, props.edits);
		});

		const { formFields, gridClass } = useForm();
		const { toggleBatchField, batchActiveFields } = useBatch();

		/**
		 * The validation errors that don't apply to any visible fields. This can occur if an admin accidentally
		 * made a hidden field required for example. We want to show these errors at the top of the page, so the
		 * admin can be made aware
		 */
		const unknownValidationErrors = computed(() => {
			const fieldKeys = formFields.value.map((field) => field.field);
			return props.validationErrors.filter((error) => fieldKeys.includes(error.field) === false);
		});

		provide('values', values);

		return {
			el,
			formFields,
			gridClass,
			values,
			setValue,
			batchActiveFields,
			toggleBatchField,
			unsetValue,
			marked,
			unknownValidationErrors,
		};

		function useForm() {
			const fields = computed(() => {
				if (props.collection) {
					return fieldsStore.getFieldsForCollection(props.collection);
				}

				if (props.fields) {
					return props.fields;
				}

				throw new Error('[v-form]: You need to pass either the collection or fields prop.');
			});

			const { formFields } = useFormFields(fields);

			const formFieldsParsed = computed(() => {
				return formFields.value.map((field: Field) => {
					if (
						field.schema?.has_auto_increment === true ||
						(field.schema?.is_primary_key === true && props.primaryKey !== '+')
					) {
						const fieldClone = cloneDeep(field) as any;
						if (!fieldClone.meta) fieldClone.meta = {};
						fieldClone.meta.readonly = true;
						return fieldClone;
					}

					return field;
				});
			});

			const { width } = useElementSize(el);

			const gridClass = computed<string | null>(() => {
				if (el.value === null) return null;

				if (width.value > 792) {
					return 'grid with-fill';
				} else {
					return 'grid';
				}

				return null;
			});

			return { formFields: formFieldsParsed, gridClass, isDisabled };

			function isDisabled(field: Field) {
				return (
					props.loading ||
					props.disabled === true ||
					field.meta?.readonly === true ||
					(props.batchMode && batchActiveFields.value.includes(field.field) === false)
				);
			}
		}

		function setValue(field: Field, value: any) {
			const edits = props.edits ? clone(props.edits) : {};
			edits[field.field] = value;
			emit('input', edits);
		}

		function unsetValue(field: Field) {
			if (props.edits?.hasOwnProperty(field.field)) {
				const newEdits = { ...props.edits };
				delete newEdits[field.field];
				emit('input', newEdits);
			}
		}

		function useBatch() {
			const batchActiveFields = ref<string[]>([]);

			return { batchActiveFields, toggleBatchField };

			function toggleBatchField(field: Field) {
				if (batchActiveFields.value.includes(field.field)) {
					batchActiveFields.value = batchActiveFields.value.filter((fieldKey) => fieldKey !== field.field);

					unsetValue(field);
				} else {
					batchActiveFields.value = [...batchActiveFields.value, field.field];
					setValue(field, field.schema?.default_value);
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.v-form {
	@include form-grid;
}
</style>
