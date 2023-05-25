<template>
	<div ref="el" class="v-form" :class="gridClass">
		<validation-errors
			v-if="showValidationErrors && validationErrors.length > 0"
			:validation-errors="validationErrors"
			:fields="fields ? fields : []"
			@scroll-to-field="scrollToField"
		/>
		<v-info
			v-if="noVisibleFields && showNoVisibleFields && !loading"
			:title="t('no_visible_fields')"
			:icon="inline ? false : 'search'"
			center
		>
			{{ t('no_visible_fields_copy') }}
		</v-info>
		<template v-for="(fieldName, index) in fieldNames" :key="fieldName">
			<template v-if="fieldsMap[fieldName]">
				<component
					:is="`interface-${fieldsMap[fieldName]!.meta?.interface || 'group-standard'}`"
					v-if="fieldsMap[fieldName]!.meta?.special?.includes('group')"
					v-show="!fieldsMap[fieldName]!.meta?.hidden"
					:ref="
					(el: Element) => {
						formFieldEls[fieldName] = el;
					}
				"
					:class="[
						fieldsMap[fieldName]!.meta?.width || 'full',
						index === firstVisibleFieldIndex ? 'first-visible-field' : '',
					]"
					:field="fieldsMap[fieldName]"
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
					:direction="direction"
					v-bind="fieldsMap[fieldName]!.meta?.options || {}"
					@apply="apply"
				/>

				<form-field
					v-else-if="!fieldsMap[fieldName]!.meta?.hidden"
					:ref="
						(el) => {
							formFieldEls[fieldName] = el;
						}
					"
					:class="index === firstVisibleFieldIndex ? 'first-visible-field' : ''"
					:field="fieldsMap[fieldName]!"
					:autofocus="index === firstEditableFieldIndex && autofocus"
					:model-value="(values || {})[fieldName]"
					:initial-value="(initialValues || {})[fieldName]"
					:disabled="isDisabled(fieldsMap[fieldName]!)"
					:batch-mode="batchMode"
					:batch-active="batchActiveFields.includes(fieldName)"
					:primary-key="primaryKey"
					:loading="loading"
					:validation-error="
						validationErrors.find(
							(err) =>
								err.collection === fieldsMap[fieldName]!.collection &&
								(err.field === fieldName || err.field.endsWith(`(${fieldName})`))
						)
					"
					:badge="badge"
					:raw-editor-enabled="rawEditorEnabled"
					:raw-editor-active="rawActiveFields.has(fieldName)"
					:direction="direction"
					@update:model-value="setValue(fieldName, $event)"
					@set-field-value="setValue($event.field, $event.value, { force: true })"
					@unset="unsetValue(fieldsMap[fieldName]!)"
					@toggle-batch="toggleBatchField(fieldsMap[fieldName]!)"
					@toggle-raw="toggleRawField(fieldsMap[fieldName]!)"
				/>
			</template>
		</template>
		<v-divider v-if="showDivider && !noVisibleFields" />
	</div>
</template>

<script setup lang="ts">
import { useFormFields } from '@/composables/use-form-fields';
import { useFieldsStore } from '@/stores/fields';
import { applyConditions } from '@/utils/apply-conditions';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { useElementSize } from '@directus/composables';
import { Field, ValidationError } from '@directus/types';
import { assign, cloneDeep, isEqual, isNil, omit, pick } from 'lodash';
import { ComputedRef, computed, onBeforeUpdate, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FormField from './form-field.vue';
import type { FormField as TFormField } from './types';
import ValidationErrors from './validation-errors.vue';

type FieldValues = {
	[field: string]: any;
};

interface Props {
	collection?: string;
	fields?: Field[];
	initialValues?: FieldValues | null;
	modelValue?: FieldValues | null;
	loading?: boolean;
	batchMode?: boolean;
	primaryKey?: string | number;
	disabled?: boolean;
	validationErrors?: ValidationError[];
	autofocus?: boolean;
	group?: string | null;
	badge?: string;
	showValidationErrors?: boolean;
	showNoVisibleFields?: boolean;
	rawEditorEnabled?: boolean;
	direction?: string;
	showDivider?: boolean;
	inline?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	collection: undefined,
	fields: undefined,
	initialValues: null,
	modelValue: null,
	loading: false,
	batchMode: false,
	primaryKey: undefined,
	disabled: false,
	validationErrors: () => [],
	autofocus: false,
	group: null,
	badge: undefined,
	showValidationErrors: true,
	showNoVisibleFields: true,
	rawEditorEnabled: false,
	direction: undefined,
	showDivider: false,
	inline: false,
});

const { t } = useI18n();

const emit = defineEmits(['update:modelValue']);

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

const { fieldNames, fieldsMap, getFieldsForGroup, fieldsForGroup, isDisabled } = useForm();
const { toggleBatchField, batchActiveFields } = useBatch();
const { toggleRawField, rawActiveFields } = useRawEditor();

const firstEditableFieldIndex = computed(() => {
	for (let i = 0; i < fieldNames.value.length; i++) {
		const field = fieldsMap.value[fieldNames.value[i]];

		if (field?.meta && !field.meta?.readonly && !field.meta?.hidden) {
			return i;
		}
	}

	return null;
});

const firstVisibleFieldIndex = computed(() => {
	for (let i = 0; i < fieldNames.value.length; i++) {
		const field = fieldsMap.value[fieldNames.value[i]];

		if (field?.meta && !field.meta?.hidden) {
			return i;
		}
	}

	return null;
});

const noVisibleFields = computed(() => {
	return Object.keys(fieldsMap.value).every((fieldKey) => {
		return fieldsMap.value[fieldKey]?.meta?.hidden === true;
	});
});

watch(
	() => props.validationErrors,
	(newVal, oldVal) => {
		if (!props.showValidationErrors) return;
		if (isEqual(newVal, oldVal)) return;
		if (newVal?.length > 0) el?.value?.scrollIntoView({ behavior: 'smooth' });
	}
);

provide('values', values);

function useForm() {
	const fieldsStore = useFieldsStore();
	const fields = ref<Field[]>(getFields());

	watch(
		() => props.fields,
		() => {
			const newVal = getFields();

			if (!isEqual(fields.value, newVal)) {
				fields.value = newVal;
			}
		}
	);

	const defaultValues = getDefaultValuesFromFields(fields);

	const { formFields } = useFormFields(fields);

	const fieldsMap: ComputedRef<Record<string, TFormField | undefined>> = computed(() => {
		if (props.loading) return {} as Record<string, undefined>;
		const valuesWithDefaults = Object.assign({}, defaultValues.value, values.value);
		return formFields.value.reduce((result: Record<string, Field>, field: Field) => {
			const newField = applyConditions(valuesWithDefaults, setPrimaryKeyReadonly(field));
			if (newField.field) result[newField.field] = newField;
			return result;
		}, {} as Record<string, Field>);
	});

	const fieldsInGroup = computed(() =>
		formFields.value.filter(
			(field: Field) => field.meta?.group === props.group || (props.group === null && isNil(field.meta?.group))
		)
	);

	const fieldNames = computed(() => {
		return fieldsInGroup.value.map((f) => f.field);
	});

	const fieldsForGroup = computed(() =>
		fieldNames.value.map((name: string) => getFieldsForGroup(fieldsMap.value[name]?.meta?.field || null))
	);

	return { fieldNames, fieldsMap, isDisabled, getFieldsForGroup, fieldsForGroup };

	function isDisabled(field: TFormField | undefined) {
		if (!field) return true;
		const meta = fieldsMap.value?.[field.field]?.meta;
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
			const meta = fieldsMap.value?.[field.field]?.meta;
			return meta?.group === group || (group === null && isNil(meta));
		});

		for (const field of fieldsInGroup) {
			const meta = fieldsMap.value?.[field.field]?.meta;

			if (meta?.special?.includes('group') && !passed.includes(meta!.field!)) {
				passed.push(meta!.field!);
				fieldsInGroup.push(...getFieldsForGroup(meta!.field!, passed));
			}
		}

		return fieldsInGroup;
	}

	function getFields(): Field[] {
		if (props.collection) {
			return fieldsStore.getFieldsForCollection(props.collection);
		}

		if (props.fields) {
			return props.fields;
		}

		throw new Error('[v-form]: You need to pass either the collection or fields prop.');
	}

	function setPrimaryKeyReadonly(field: Field) {
		if (
			field.schema?.is_primary_key === true &&
			props.primaryKey !== '+' &&
			(field.schema?.has_auto_increment === true || field.meta?.special?.includes('uuid'))
		) {
			const fieldClone = cloneDeep(field) as any;
			if (!fieldClone.meta) fieldClone.meta = {};
			fieldClone.meta.readonly = true;
			return fieldClone;
		}

		return field;
	}
}

function setValue(fieldKey: string, value: any, opts?: { force?: boolean }) {
	const field = fieldsMap.value[fieldKey];

	if (opts?.force !== true && (!field || isDisabled(field))) return;

	const edits = props.modelValue ? cloneDeep(props.modelValue) : {};
	edits[fieldKey] = value;
	emit('update:modelValue', edits);
}

function apply(updates: { [field: string]: any }) {
	const updatableKeys = props.batchMode
		? Object.keys(updates)
		: Object.keys(updates).filter((key) => {
				const field = fieldsMap.value[key];
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

function unsetValue(field: TFormField | undefined) {
	if (!field) return;
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

	function toggleBatchField(field: TFormField | undefined) {
		if (!field) return;

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

	function toggleRawField(field: TFormField | undefined) {
		if (!field) return;

		if (rawActiveFields.value.has(field.field)) {
			rawActiveFields.value.delete(field.field);
		} else {
			rawActiveFields.value.add(field.field);
		}
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.v-form {
	@include form-grid;
}

.v-form .first-visible-field :deep(.v-divider) {
	margin-top: 0;
}

.v-divider {
	margin-bottom: 50px;
	grid-column-start: 1;
	grid-column-end: 3;
}
</style>
