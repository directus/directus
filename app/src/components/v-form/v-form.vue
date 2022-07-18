<template>
	<div ref="el" class="v-form" :class="gridClass">
		<validation-errors
			v-if="!nested && validationErrors.length > 0"
			:validation-errors="validationErrors"
			:fields="fields ? fields : []"
			@scroll-to-field="scrollToField"
		/>
		<template v-for="(fieldName, index) in fieldNames">
			<component
				:is="`interface-${fieldConf[fieldName].meta?.interface || 'group-standard'}`"
				v-if="fieldConf[fieldName].meta?.special?.includes('group')"
				v-show="!fieldConf[fieldName].meta?.hidden"
				:ref="
					(el: Element) => {
						formFieldEls[fieldName] = el;
					}
				"
				:key="fieldName + '_group'"
				:class="[
					fieldConf[fieldName].meta?.width || 'full',
					index === firstVisibleFieldIndex ? 'first-visible-field' : '',
				]"
				:field="fieldConf[fieldName]"
				:fields="fieldsForGroup[index] || []"
				:values="modelValue || {}"
				:initial-values="initialValues || {}"
				:disabled="disabled"
				:batch-mode="batchMode"
				:batch-active-fields="batchActiveFields"
				:primary-key="primaryKey"
				:loading="loading"
				:validation-errors="validationErrors"
				:badge="badge"
				:raw-editor-enabled="rawEditorEnabled"
				v-bind="fieldConf[fieldName].meta?.options || {}"
				@apply="apply"
			/>

			<form-field
				v-else-if="!fieldConf[fieldName].meta?.hidden"
				:ref="
					(el: Element) => {
						formFieldEls[fieldName] = el;
					}
				"
				:key="fieldName + '_field'"
				:class="index === firstVisibleFieldIndex ? 'first-visible-field' : ''"
				:field="fieldConf[fieldName]"
				:autofocus="index === firstEditableFieldIndex && autofocus"
				:model-value="(values || {})[fieldName]"
				:initial-value="(initialValues || {})[fieldName]"
				:disabled="isDisabled(fieldConf[fieldName])"
				:batch-mode="batchMode"
				:batch-active="batchActiveFields.includes(fieldName)"
				:primary-key="primaryKey"
				:loading="loading"
				:validation-error="
					validationErrors.find(
						(err) =>
							err.collection === fieldConf[fieldName]?.collection &&
							(err.field === fieldName || err.field.endsWith(`(${fieldName})`))
					)
				"
				:badge="badge"
				:raw-editor-enabled="rawEditorEnabled"
				:raw-editor-active="rawActiveFields.has(fieldName)"
				@update:model-value="setValue(fieldName, $event)"
				@set-field-value="setValue($event.field, $event.value)"
				@unset="unsetValue(fieldConf[fieldName])"
				@toggle-batch="toggleBatchField(fieldConf[fieldName])"
				@toggle-raw="toggleRawField(fieldConf[fieldName])"
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { useElementSize } from '@/composables/use-element-size';
import useFormFields from '@/composables/use-form-fields';
import { useFieldsStore } from '@/stores/';
import { applyConditions } from '@/utils/apply-conditions';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';
import { Field, FieldMeta, ValidationError } from '@directus/shared/types';
import { assign, cloneDeep, isEqual, isNil, omit, pick } from 'lodash';
import { computed, defineComponent, onBeforeUpdate, PropType, provide, ref, watch, Ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import FormField from './form-field.vue';
import ValidationErrors from './validation-errors.vue';
import { translate } from '@/utils/translate-object-values';

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
		rawEditorEnabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fields = useComputedFields();

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

		const { formFields, getFieldsForGroup, fieldsForGroup, isDisabled, fieldNames, /*fieldsMeta,*/ fieldConf } =
			useForm();
		const { toggleBatchField, batchActiveFields } = useBatch();
		const { toggleRawField, rawActiveFields } = useRawEditor();

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
			rawActiveFields,
			toggleRawField,
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
			// fieldsMeta,
			fieldNames,
			fieldConf,
		};

		function useForm() {
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

			const translatedFields = computed(() => translate(fields.value));

			const fieldConf = computed(() => {
				const valuesWithDefaults = Object.assign({}, defaultValues.value, values.value);
				return translatedFields.value.reduce((result: Record<string, Field>, field: Field) => {
					const f = applyConditions(valuesWithDefaults, setPrimaryKeyReadonly(field));
					if (f.field) result[f.field] = f;
					return result;
				}, {} as Record<string, Field>);

				function setPrimaryKeyReadonly(field: Field) {
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
				}
			});

			const fieldsInGroup = computed(() =>
				fields.value.filter(
					(field: Field) => field.meta?.group === props.group || (props.group === null && isNil(field.meta?.group))
				)
			);

			const { formFields } = useFormFields(fieldsInGroup);

			const fieldsForGroup = computed(() =>
				formFields.value.map((field: Field) => getFieldsForGroup(field.meta?.field || null))
			);

			const fieldNames = computed(() => {
				return formFields.value.map((f) => f.field);
			});

			return { formFields, fieldNames, /*fieldsMeta,*/ fieldConf, isDisabled, getFieldsForGroup, fieldsForGroup };

			function isDisabled(field: Field) {
				const meta = fieldConf.value?.[field.field].meta;
				return (
					props.loading ||
					props.disabled === true ||
					meta?.readonly === true ||
					field.schema?.is_generated === true ||
					(props.batchMode && batchActiveFields.value.includes(field.field) === false)
				);
			}

			function getFieldsForGroup(group: null | string, passed: string[] = []): Field[] {
				const fieldsInGroup: Field[] = fields.value.filter((field) => {
					const meta = fieldConf.value?.[field.field].meta;
					return meta?.group === group || (group === null && isNil(meta));
				});

				for (const field of fieldsInGroup) {
					const meta = fieldConf.value?.[field.field].meta;
					if (meta?.special?.includes('group') && !passed.includes(meta!.field)) {
						passed.push(meta!.field);
						fieldsInGroup.push(...getFieldsForGroup(meta!.field, passed));
					}
				}

				return fieldsInGroup;
			}
			// function getFieldNames(fields: Field[]): string[] {
			// 	return fields.map((f) => f.field);
			// }
		}

		function useComputedFields() {
			const fieldsStore = useFieldsStore();
			const fields = ref<Field[]>(getFields());

			watch(
				() => props.fields,
				() => {
					const newVal = getFields();
					if (!isEqual(fields.value, newVal)) {
						fields.value = newVal;
					}
					// const names = getFieldNames(newVal);
					// if (!isEqual(fieldNames.value, names)) {
					// 	fieldNames.value = names;
					// }
				}
			);

			return fields; //{ fields, fieldNames };

			function getFields(): Field[] {
				if (props.collection) {
					return fieldsStore.getFieldsForCollection(props.collection);
				}
				if (props.fields) {
					return props.fields;
				}

				throw new Error('[v-form]: You need to pass either the collection or fields prop.');
			}
		}

		function setValue(fieldKey: string, value: any) {
			const field = formFields.value?.find((field) => field.field === fieldKey);

			if (!field || isDisabled(field)) return;

			const edits = props.modelValue ? cloneDeep(props.modelValue) : {};
			edits[fieldKey] = value;
			emit('update:modelValue', edits);
		}

		function apply(updates: { [field: string]: any }) {
			const updatableKeys = props.batchMode
				? Object.keys(updates)
				: Object.keys(updates).filter((key) => {
						const field = fields.value?.find((field) => field.field === key);
						if (!field) return false;
						return field.schema?.is_primary_key || !isDisabled(field);
				  });

			if (!isNil(props.group)) {
				const groupFields = getFieldsForGroup(props.group)
					.filter((field) => !field.schema?.is_primary_key && !isDisabled(field))
					.map((field) => field.field);
				emit('update:modelValue', assign({}, omit(props.modelValue, groupFields), pick(updates, updatableKeys)));
			} else {
				emit('update:modelValue', pick(assign({}, props.modelValue, updates), updatableKeys));
			}
		}

		function unsetValue(field: Field) {
			if (!props.batchMode && isDisabled(field)) return;

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
					setValue(field.field, field.schema?.default_value);
				}
			}
		}

		function scrollToField(fieldKey: string) {
			const { field } = extractFieldFromFunction(fieldKey);
			if (!formFieldEls.value[field]) return;
			formFieldEls.value[field].$el.scrollIntoView({ behavior: 'smooth' });
		}

		function useRawEditor() {
			const rawActiveFields = ref(new Set<string>());

			return { rawActiveFields, toggleRawField };

			function toggleRawField(field: Field) {
				if (rawActiveFields.value.has(field.field)) {
					rawActiveFields.value.delete(field.field);
				} else {
					rawActiveFields.value.add(field.field);
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

.v-form .first-visible-field :deep(.v-divider) {
	margin-top: 0;
}
</style>
