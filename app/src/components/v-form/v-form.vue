<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { applyConditions } from '@/utils/apply-conditions';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
import { useElementSize } from '@directus/composables';
import { ContentVersion, Field, ValidationError } from '@directus/types';
import { assign, cloneDeep, isEmpty, isEqual, isNil, omit } from 'lodash';
import { computed, onBeforeUpdate, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MenuOptions } from './form-field-menu.vue';
import FormField from './form-field.vue';
import type { ComparisonContext, FormField as TFormField } from './types';
import { getFormFields } from './utils/get-form-fields';
import { updateFieldWidths } from './utils/update-field-widths';
import { updateSystemDivider } from './utils/update-system-divider';
import ValidationErrors from './validation-errors.vue';

type FieldValues = {
	[field: string]: any;
};

const props = withDefaults(
	defineProps<{
		collection?: string;
		fields?: Field[];
		initialValues?: FieldValues | null;
		modelValue?: FieldValues | null;
		loading?: boolean;
		batchMode?: boolean;
		primaryKey?: string | number;
		disabled?: boolean;
		nonEditable?: boolean;
		validationErrors?: ValidationError[];
		autofocus?: boolean;
		group?: string | null;
		badge?: string;
		showValidationErrors?: boolean;
		showNoVisibleFields?: boolean;
		/* Enable the raw editor toggler on fields */
		rawEditorEnabled?: boolean;
		disabledMenuOptions?: MenuOptions[];
		disabledMenu?: boolean;
		direction?: string;
		showDivider?: boolean;
		inline?: boolean;
		version?: ContentVersion | null;
		comparison?: ComparisonContext;
	}>(),
	{
		collection: undefined,
		fields: undefined,
		initialValues: null,
		modelValue: null,
		primaryKey: undefined,
		validationErrors: () => [],
		group: null,
		badge: undefined,
		showValidationErrors: true,
		showNoVisibleFields: true,
		direction: undefined,
		version: null,
	},
);

const { t } = useI18n();

const emit = defineEmits(['update:modelValue']);

const isNonEditable = computed(() => !!props.nonEditable);

const values = computed(() => {
	return Object.assign({}, cloneDeep(props.initialValues), cloneDeep(props.modelValue));
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

const {
	fields: finalFields,
	fieldNames,
	fieldsMap,
	fieldsForGroup,
	isDisabled,
	getFieldsForGroup,
	isFieldVisible,
} = useForm();

const { toggleBatchField, batchActiveFields } = useBatch();
const { toggleRawField, rawActiveFields } = useRawEditor();

const firstEditableFieldIndex = computed(() => {
	for (const [index, fieldName] of fieldNames.value.entries()) {
		const field = fieldsMap.value[fieldName];

		if (field?.meta && !field.meta?.readonly && isFieldVisible(field)) {
			return index;
		}
	}

	return null;
});

const firstVisibleFieldIndex = computed(() => {
	for (const [index, fieldName] of fieldNames.value.entries()) {
		const field = fieldsMap.value[fieldName];

		if (field?.meta && isFieldVisible(field)) {
			return index;
		}
	}

	return null;
});

const noVisibleFields = computed(() => {
	return Object.keys(fieldsMap.value).every((fieldKey) => {
		return !isFieldVisible(fieldsMap.value[fieldKey]!);
	});
});

watch(
	() => props.validationErrors,
	(newVal, oldVal) => {
		if (!props.showValidationErrors) return;
		if (isEqual(newVal, oldVal)) return;
		if (newVal?.length > 0) el?.value?.scrollIntoView({ behavior: 'smooth' });
	},
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
		},
	);

	const defaultValues = getDefaultValuesFromFields(fields);

	const formFields = getFormFields(fields);

	const fieldsWithConditions = computed(() => {
		const valuesWithDefaults = Object.assign({}, defaultValues.value, values.value);

		let fields = formFields.value.map((field) =>
			applyConditions(valuesWithDefaults, setPrimaryKeyReadonly(field), props.version),
		);

		fields = pushGroupOptionsDown(fields);
		updateSystemDivider(fields, isFieldVisible);
		updateFieldWidths(fields, isFieldVisible);

		return fields;
	});

	const fieldsMap = computed<Record<string, TFormField | undefined>>(() => {
		return Object.fromEntries(fieldsWithConditions.value.map((field) => [field.field, field]));
	});

	const fieldNames = computed(() => {
		const fieldsInGroup = formFields.value.filter(
			(field: Field) => field.meta?.group === props.group || (props.group === null && isNil(field.meta?.group)),
		);

		return fieldsInGroup.map((field) => field.field);
	});

	const fieldsForGroup = computed(() => {
		return fieldNames.value.map((name) => getFieldsForGroup(fieldsMap.value[name]?.meta?.field || null));
	});

	return { fields, fieldNames, fieldsMap, fieldsForGroup, isDisabled, getFieldsForGroup, isFieldVisible };

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
		const fieldsInGroup = fieldsWithConditions.value.filter((field) => {
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

	function isFieldVisible(field: Field | TFormField): boolean {
		return (
			field.meta?.hidden !== true ||
			!!props.comparison?.fields?.has(field.field) ||
			!!props.comparison?.revisionFields?.has(field.field)
		);
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
				return (
					(updates.$type === 'created' && field.meta?.readonly) || field.schema?.is_primary_key || !isDisabled(field)
				);
			});

	if (!isNil(props.group)) {
		const groupFields = getFieldsForGroup(props.group)
			.filter((field) => !field.schema?.is_primary_key && !isDisabled(field))
			.map((field) => field.field);

		emit('update:modelValue', assign({}, omit(props.modelValue, groupFields), pickKeepMeta(updates, updatableKeys)));
	} else {
		emit('update:modelValue', pickKeepMeta(assign({}, props.modelValue, updates), updatableKeys));
	}
}

function pickKeepMeta(obj: Record<string, any>, keys: string[]) {
	return Object.entries(obj).reduce<Record<string, any>>((result, [key, value]) => {
		if (keys.includes(key) || key.startsWith('$')) result[key] = value;
		return result;
	}, {});
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

	watch(
		() => props.modelValue,
		(newModelValue) => {
			if (!props.batchMode || isEmpty(newModelValue) || !isEmpty(batchActiveFields.value)) return;

			batchActiveFields.value = Object.keys(newModelValue);
		},
		{ immediate: true },
	);

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

function getFirstVisibleFieldClass(index: number) {
	return index === firstVisibleFieldIndex.value ? 'first-visible-field' : '';
}

function getComparisonIndicatorClasses(field: TFormField, isGroup = false) {
	if (isComparisonDiff()) {
		if (field.indicatorStyle === 'active') return 'indicator-active';
		if (field.indicatorStyle === 'muted') return 'indicator-muted';
	}

	return '';

	function isComparisonDiff() {
		if (field.indicatorStyle === 'hidden' || !props.comparison) return false;

		if (isGroup) {
			const groupFields = getFieldsForGroup(field.meta?.field ?? null);
			return groupFields.some((groupField) => props.comparison!.fields.has(groupField.field));
		}

		return props.comparison.fields.has(field.field);
	}
}
</script>

<template>
	<div ref="el" :class="['v-form', gridClass, { inline, 'non-editable': isNonEditable }]">
		<validation-errors
			v-if="showValidationErrors && validationErrors.length > 0"
			:validation-errors="validationErrors"
			:fields="finalFields"
			@scroll-to-field="scrollToField"
		/>
		<v-info
			v-if="noVisibleFields && showNoVisibleFields && !loading"
			class="no-fields-info"
			:title="t('no_visible_fields')"
			:icon="inline ? false : 'search'"
			:center="!inline"
		>
			{{ t('no_visible_fields_copy') }}
		</v-info>
		<template v-for="(fieldName, index) in fieldNames" :key="fieldName">
			<template v-if="fieldsMap[fieldName]">
				<component
					:is="`interface-${fieldsMap[fieldName]!.meta?.interface || 'group-standard'}`"
					v-if="fieldsMap[fieldName]!.meta?.special?.includes('group') && isFieldVisible(fieldsMap[fieldName])"
					:ref="
						(el: Element) => {
							formFieldEls[fieldName] = el;
						}
					"
					:class="[
						fieldsMap[fieldName]!.meta?.width || 'full',
						getFirstVisibleFieldClass(index),
						getComparisonIndicatorClasses(fieldsMap[fieldName]!, true),
					]"
					:field="fieldsMap[fieldName]"
					:fields="fieldsForGroup[index] || []"
					:values="modelValue || {}"
					:initial-values="initialValues || {}"
					:disabled="disabled || isNonEditable"
					:batch-mode="batchMode"
					:batch-active-fields="batchActiveFields"
					:primary-key="primaryKey"
					:loading="loading"
					:validation-errors="validationErrors"
					:badge="badge"
					:raw-editor-enabled="rawEditorEnabled"
					:direction="direction"
					:version
					:non-editable="isNonEditable"
					:comparison="comparison"
					v-bind="fieldsMap[fieldName]!.meta?.options || {}"
					@apply="apply"
				/>

				<form-field
					v-else-if="isFieldVisible(fieldsMap[fieldName])"
					:ref="
						(el) => {
							formFieldEls[fieldName] = el;
						}
					"
					:class="[getFirstVisibleFieldClass(index), getComparisonIndicatorClasses(fieldsMap[fieldName]!)]"
					:field="fieldsMap[fieldName]!"
					:autofocus="index === firstEditableFieldIndex && autofocus"
					:model-value="(values || {})[fieldName]"
					:initial-value="(initialValues || {})[fieldName]"
					:disabled="isDisabled(fieldsMap[fieldName]!) || isNonEditable"
					:batch-mode="batchMode"
					:non-editable="isNonEditable"
					:batch-active="batchActiveFields.includes(fieldName)"
					:comparison="comparison"
					:comparison-active="comparison?.selectedFields.includes(fieldName)"
					:primary-key="primaryKey"
					:loading="loading"
					:validation-error="
						validationErrors.find(
							(err) =>
								err.collection === fieldsMap[fieldName]!.collection &&
								(err.field === fieldName || err.field.endsWith(`(${fieldName})`)),
						)
					"
					:badge="badge"
					:raw-editor-enabled="rawEditorEnabled"
					:raw-editor-active="rawActiveFields.has(fieldName)"
					:disabled-menu-options="disabledMenuOptions"
					:disabled-menu="disabledMenu"
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

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-form {
	@include mixins.form-grid;

	--form--field--input--disabled--background: var(--theme--form--field--input--background-subdued);
	--form--field--input--disabled--foreground: var(--theme--form--field--input--foreground-subdued);
	--form--icon--disabled: var(--theme--foreground-subdued);
	--form--field--disabled--primary: var(--theme--foreground-subdued);
	&.non-editable {
		--form--field--input--disabled--background: var(--theme--form--field--input--background);
		--form--field--input--disabled--foreground: var(--theme--form--field--input--foreground);
		--form--icon--disabled: var(--theme--primary);
		--form--field--disabled--primary: var(--theme--primary);
	}

	.first-visible-field :deep(.presentation-divider) {
		margin-block-start: 0;
	}

	&.inline > .no-fields-info {
		grid-column: 1 / -1;
	}
}

.v-divider {
	margin-block-end: 50px;
	grid-column: 1 / 3;
}

.indicator-active {
	@include mixins.field-indicator;
}

.indicator-muted {
	@include mixins.field-indicator('muted');
}
</style>
