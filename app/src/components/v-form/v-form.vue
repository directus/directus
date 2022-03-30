<template>
	<div ref="el" class="v-form" :class="gridClass">
		<validation-errors
			v-if="!nested && validationErrors.length > 0"
			:validation-errors="validationErrors"
			:fields="formFields"
			@scroll-to-field="scrollToField"
		/>
		<template v-for="(field, index) in formFields">
			<component
				:is="`interface-${field.meta?.interface || 'group-standard'}`"
				v-if="field.meta?.special?.includes('group')"
				v-show="!field.meta?.hidden"
				:ref="
					(el: Element) => {
						formFieldEls[field.field] = el;
					}
				"
				:key="field.field"
				:class="[field.meta?.width || 'full', index === firstVisibleFieldIndex ? 'first-visible-field' : '']"
				:field="field"
				:fields="fieldsForGroup[index]"
				:values="modelValue || {}"
				:initial-values="initialValues || {}"
				:disabled="disabled"
				:batch-mode="batchMode"
				:batch-active-fields="batchActiveFields"
				:primary-key="primaryKey"
				:loading="loading"
				:validation-errors="validationErrors"
				v-bind="field.meta?.options || {}"
				@apply="apply"
			/>

			<form-field
				v-else-if="!field.meta?.hidden"
				:ref="
					(el: Element) => {
						formFieldEls[field.field] = el;
					}
				"
				:key="field.field"
				:class="index === firstVisibleFieldIndex ? 'first-visible-field' : ''"
				:field="field"
				:autofocus="index === firstEditableFieldIndex && autofocus"
				:model-value="(values || {})[field.field]"
				:initial-value="(initialValues || {})[field.field]"
				:disabled="isDisabled(field)"
				:batch-mode="batchMode"
				:batch-active="batchActiveFields.includes(field.field)"
				:primary-key="primaryKey"
				:loading="loading"
				:validation-error="validationErrors.find((err) => err.field === field.field)"
				:badge="badge"
				@update:model-value="setValue(field, $event)"
				@unset="unsetValue(field)"
				@toggle-batch="toggleBatchField(field)"
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed, ref, provide, watch, onBeforeUpdate } from 'vue';
import { useFieldsStore } from '@/stores/';
import { Field, ValidationError } from '@directus/shared/types';
import { assign, cloneDeep, isEqual, isNil, omit, pick } from 'lodash';
import useFormFields from '@/composables/use-form-fields';
import { useElementSize } from '@/composables/use-element-size';
import FormField from './form-field.vue';
import ValidationErrors from './validation-errors.vue';
import { applyConditions } from '@/utils/apply-conditions';

type FieldValues = {
	[field: string]: any;
};

export default defineComponent({
	name: 'VForm',
	components: { FormField, ValidationErrors },
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
		modelValue: {
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
		autofocus: {
			type: Boolean,
			default: false,
		},
		group: {
			type: String,
			default: null,
		},
		badge: {
			type: String,
			default: null,
		},
		nested: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fieldsStore = useFieldsStore();

		const values = computed(() => {
			return Object.assign({}, props.initialValues, props.modelValue);
		});

		const el = ref<Element>();

		const { width } = useElementSize(el);

		const gridClass = computed<string | null>(() => {
			if (el.value === null) return null;

			if (width.value > 792) {
				return 'grid with-fill';
			} else {
				return 'grid';
			}
		});

		const formFieldEls = ref<Record<string, any>>({});

		onBeforeUpdate(() => {
			formFieldEls.value = {};
		});

		const { formFields, getFieldsForGroup, fieldsForGroup, isDisabled } = useForm();
		const { toggleBatchField, batchActiveFields } = useBatch();

		const firstEditableFieldIndex = computed(() => {
			for (let i = 0; i < formFields.value.length; i++) {
				if (formFields.value[i].meta && !formFields.value[i].meta?.readonly && !formFields.value[i].meta?.hidden) {
					return i;
				}
			}
			return null;
		});

		const firstVisibleFieldIndex = computed(() => {
			for (let i = 0; i < formFields.value.length; i++) {
				if (formFields.value[i].meta && !formFields.value[i].meta?.hidden) {
					return i;
				}
			}
			return null;
		});

		watch(
			() => props.validationErrors,
			(newVal, oldVal) => {
				if (props.nested) return;
				if (isEqual(newVal, oldVal)) return;
				if (newVal?.length > 0) el?.value?.scrollIntoView({ behavior: 'smooth' });
			}
		);

		provide('values', values);

		return {
			t,
			formFields,
			values,
			setValue,
			batchActiveFields,
			toggleBatchField,
			unsetValue,
			firstEditableFieldIndex,
			firstVisibleFieldIndex,
			isNil,
			apply,
			el,
			gridClass,
			omit,
			getFieldsForGroup,
			fieldsForGroup,
			isDisabled,
			scrollToField,
			formFieldEls,
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

			const defaultValues = computed(() => {
				return fields.value.reduce(function (acc, field) {
					if (
						field.schema?.default_value !== undefined &&
						// Ignore autoincremented integer PK field
						!(
							field.schema.is_primary_key &&
							field.schema.data_type === 'integer' &&
							typeof field.schema.default_value === 'string'
						)
					) {
						acc[field.field] = field.schema?.default_value;
					}
					return acc;
				}, {} as Record<string, any>);
			});

			const fieldsParsed = computed(() => {
				if (props.group !== null) return fields.value;

				const setPrimaryKeyReadonly = (field: Field) => {
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
				};

				const valuesWithDefaults = Object.assign({}, defaultValues.value, values.value);

				return fields.value.map((field) => applyConditions(valuesWithDefaults, setPrimaryKeyReadonly(field)));
			});

			const fieldsInGroup = computed(() =>
				fieldsParsed.value.filter(
					(field) => field.meta?.group === props.group || (props.group === null && isNil(field.meta?.group))
				)
			);

			const { formFields } = useFormFields(fieldsInGroup);

			const fieldsForGroup = computed(() => formFields.value.map((field) => getFieldsForGroup(field.meta?.field)));

			return { formFields, isDisabled, getFieldsForGroup, fieldsForGroup };

			function isDisabled(field: Field) {
				return (
					props.loading ||
					props.disabled === true ||
					field.meta?.readonly === true ||
					field.schema?.is_generated === true ||
					(props.batchMode && batchActiveFields.value.includes(field.field) === false)
				);
			}

			function getFieldsForGroup(group: null | string): Field[] {
				const fieldsInGroup: Field[] = fieldsParsed.value.filter(
					(field) => field.meta?.group === group || (group === null && isNil(field.meta))
				);

				for (const field of fieldsInGroup) {
					if (field.meta?.special?.includes('group')) {
						fieldsInGroup.push(...getFieldsForGroup(field.meta!.field));
					}
				}

				return fieldsInGroup;
			}
		}

		function setValue(field: Field, value: any) {
			if (isDisabled(field)) return;

			const edits = props.modelValue ? cloneDeep(props.modelValue) : {};
			edits[field.field] = value;
			emit('update:modelValue', edits);
		}

		function apply(updates: { [field: string]: any }) {
			const updatableKeys = Object.keys(updates).filter((key) => {
				const field = props.fields?.find((field) => field.field === key);
				if (!field) return false;
				return field.schema?.is_primary_key || !isDisabled(field);
			});

			emit('update:modelValue', pick(assign({}, props.modelValue, updates), updatableKeys));
		}

		function unsetValue(field: Field) {
			if (isDisabled(field)) return;

			if (field.field in (props.modelValue || {})) {
				const newEdits = { ...props.modelValue };
				delete newEdits[field.field];
				emit('update:modelValue', newEdits);
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

		function scrollToField(field: string) {
			if (!formFieldEls.value[field]) return;
			formFieldEls.value[field].$el.scrollIntoView({ behavior: 'smooth' });
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.v-form {
	@include form-grid;
}

.v-form .first-visible-field :deep(.v-divider) {
	margin-top: 0;
}
</style>
