<script setup lang="ts">
defineOptions({ inheritAttrs: false });

import type { Field } from '@directus/types';
import { sortBy } from 'lodash';
import { AccordionContent, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui';
import { computed, nextTick, ref, toRefs, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import { resolveFieldName } from './resolve-field-name';
import type { RepeaterEmits, RepeaterProps } from './types';
import TransitionExpand from '@/components/transition/expand.vue';
import VButton from '@/components/v-button.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VNotice from '@/components/v-notice.vue';
import VRemove from '@/components/v-remove.vue';
import { useInjectNestedValidation } from '@/composables/use-nested-validation';
import RenderTemplate from '@/views/private/components/render-template.vue';

const props = withDefaults(defineProps<RepeaterProps>(), {
	fields: () => [],
	showConfirmDiscard: true,
});

const emit = defineEmits<RepeaterEmits>();

const { value } = toRefs(props);
const { locale } = useI18n();
const listItemForms = useTemplateRef<HTMLDivElement[]>('list-item-form');

const templateWithDefaults = computed(() =>
	props.fields?.[0]?.field ? props.template || `{{${props.fields[0].field}}}` : '',
);

const fieldsWithNames = computed(
	() =>
		props.fields
			.filter((field) => field?.field)
			.map((field) => {
				return {
					...field,
					name: resolveFieldName(field, locale.value),
				};
			}) as Field[],
);

const showAddNew = computed(() => {
	if (props.disabled || props.nonEditable || fieldsWithNames.value.length === 0) return false;
	if (props.value === null) return true;
	if (props.limit === undefined) return true;
	if (Array.isArray(props.value) && props.value.length < props.limit) return true;
	return false;
});

const defaults = computed(() => {
	const values: Record<string, unknown> = {};

	for (const field of props.fields) {
		if (field.schema?.default_value !== undefined && field.schema?.default_value !== null) {
			values[field.field!] = field.schema.default_value;
		}
	}

	return values;
});

const internalValue = computed({
	get: () => {
		if (props.fields && props.sort) return sortBy(value.value, props.sort);
		return value.value;
	},
	set: (newVal) => {
		value.value = props.fields && props.sort ? sortBy(value.value, props.sort) : newVal;
	},
});

const expandedItems = ref<string[]>([]);
const isDragging = ref(false);

let nextRowId = 0;
const makeRowId = () => `row-${nextRowId++}`;
const rowIds = ref<string[]>([]);

watch(
	() => internalValue.value,
	(val) => {
		const len = Array.isArray(val) ? val.length : 0;
		if (rowIds.value.length === len) return;

		if (len < rowIds.value.length) {
			rowIds.value.length = len;
		} else {
			while (rowIds.value.length < len) rowIds.value.push(makeRowId());
		}
	},
	{ immediate: true },
);

const wrappedRows = computed(() => {
	if (!Array.isArray(internalValue.value)) return [];
	return internalValue.value.map((data, i) => ({ id: rowIds.value[i]!, data }));
});

function isExpanded(id: string) {
	return expandedItems.value.includes(id);
}

function onRowsReorder(rows: { id: string; data: Record<string, unknown> }[]) {
	rowIds.value = rows.map((r) => r.id);
	emitValue(rows.map((r) => r.data));
}

const { updateNestedValidationErrors } = useInjectNestedValidation();

const itemValidationErrors = computed<Record<number, any[]>>(() => {
	const errorsMap: Record<number, any[]> = {};

	if (!Array.isArray(internalValue.value)) return errorsMap;

	internalValue.value.forEach((item, index) => {
		const errors: any[] = [];

		for (const field of props.fields ?? []) {
			if (!field.field || !field.meta?.required) continue;

			const val = item[field.field];

			const isEmpty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);

			if (isEmpty) {
				errors.push({ field: field.field, type: 'nnull' });
			}
		}

		if (errors.length > 0) errorsMap[index] = errors;
	});

	return errorsMap;
});

watch(
	itemValidationErrors,
	(errorsMap) => {
		if (!props.field) return;

		const allErrors = Object.entries(errorsMap).flatMap(([indexStr, errors]) => {
			const index = Number(indexStr);

			return errors.map((error) => {
				const fieldDef = props.fields?.find((f) => f.field === error.field);

				return {
					...error,
					field: `${props.field}.${index}.${error.field}`,
					nestedNames: {
						[String(index)]: `[${index}]`,
						[error.field]: fieldDef?.name ?? fieldDef?.field ?? error.field,
					},
				};
			});
		});

		updateNestedValidationErrors(props.field, allErrors);
	},
	{ immediate: true },
);

function removeItem(index: number) {
	performRemoval(index);
}

function performRemoval(index: number) {
	const removedId = rowIds.value[index];
	rowIds.value.splice(index, 1);

	const newValue = internalValue.value?.filter((_, i) => i !== index);
	emitValue(newValue);

	if (removedId !== undefined) {
		expandedItems.value = expandedItems.value.filter((id) => id !== removedId);
	}
}

function addNew() {
	const newDefaults: Record<string, unknown> = {};

	for (const field of props.fields) {
		newDefaults[field.field!] = field.schema?.default_value;
	}

	const newId = makeRowId();
	rowIds.value.push(newId);
	expandedItems.value.push(newId);

	if (Array.isArray(internalValue.value)) {
		emitValue([...internalValue.value, newDefaults]);
	} else {
		emitValue([newDefaults]);
	}

	nextTick(() => {
		const lastForm = listItemForms.value?.at(-1);
		const firstInput = lastForm?.querySelector('input, select, textarea');

		if (firstInput instanceof HTMLElement) {
			firstInput.focus();
		}
	});
}

function emitValue(value?: Record<string, unknown>[]) {
	if (!value || value.length === 0) {
		return emit('input', null);
	}

	return emit('input', props.fields && props.sort ? sortBy(value, props.sort) : value);
}
</script>

<template>
	<div class="repeater">
		<VNotice v-if="(Array.isArray(internalValue) && internalValue.length === 0) || internalValue == null">
			{{ placeholder || $t('no_items') }}
		</VNotice>
		<VNotice v-else-if="!Array.isArray(internalValue)" type="warning">
			{{ $t('interfaces.list.incompatible_data') }}
		</VNotice>
		<VNotice v-else-if="fieldsWithNames.length === 0" type="warning">
			{{ $t('no_visible_fields_copy') }}
		</VNotice>

		<AccordionRoot v-else v-model="expandedItems" type="multiple">
			<Draggable
				v-if="Array.isArray(internalValue) && internalValue.length > 0"
				tag="v-list"
				:model-value="wrappedRows"
				:disabled="disabled || nonEditable"
				item-key="id"
				handle=".drag-handle"
				v-bind="{ 'force-fallback': true }"
				class="v-list"
				:class="{ dragging: isDragging }"
				@start="isDragging = true"
				@end="isDragging = false"
				@update:model-value="onRowsReorder"
			>
				<template #item="{ element, index }">
					<AccordionItem :value="element.id" as-child>
						<VListItem :dense="internalValue.length > 4" block clickable activator grow class="list-item">
							<div class="list-item-content">
								<div class="list-item-header" :class="{ 'border-bottom': isExpanded(element.id) }">
									<AccordionTrigger as="div" class="list-item-trigger">
										<div class="list-item-header-controls">
											<VIcon
												v-if="!disabled && !nonEditable && !sort"
												name="drag_handle"
												class="drag-handle"
												@click.stop
											/>
											<VIcon :name="isExpanded(element.id) ? 'expand_more' : 'chevron_right'" class="expand-icon" />
										</div>
										<RenderTemplate
											:fields="fields"
											:item="{ ...defaults, ...element.data }"
											:direction="direction"
											:template="templateWithDefaults"
											class="list-item-header-content"
										/>
									</AccordionTrigger>

									<div v-if="!nonEditable" class="item-actions">
										<VRemove :confirm="showConfirmDiscard" :disabled @action="removeItem(index)" />
									</div>
								</div>
								<TransitionExpand>
									<AccordionContent as-child>
										<div ref="list-item-form" class="list-item-form">
											<VForm
												:disabled="disabled"
												:non-editable="nonEditable"
												:fields="fieldsWithNames"
												:model-value="element.data"
												:direction="direction"
												primary-key="+"
												@update:model-value="
													(updatedElement: Record<string, unknown>) => {
														const updatedValue = [...internalValue!];
														updatedValue[index] = updatedElement;
														emitValue(updatedValue);
													}
												"
											/>
										</div>
									</AccordionContent>
								</TransitionExpand>
							</div>
						</VListItem>
					</AccordionItem>
				</template>
			</Draggable>
		</AccordionRoot>

		<div class="action-bar justify-between">
			<VButton v-if="showAddNew" class="add-new" :disabled="disabled" @click="addNew">
				{{ addLabel || $t('create_new') }}
			</VButton>

			<div v-if="Array.isArray(internalValue) && internalValue.length > 0" class="action-bar">
				<VButton
					v-tooltip="$t('collapse_all')"
					:disabled="expandedItems.length === 0"
					icon
					secondary
					@click="expandedItems = []"
				>
					<VIcon name="unfold_less" />
				</VButton>

				<VButton
					v-tooltip="$t('expand_all')"
					:disabled="expandedItems.length === internalValue.length"
					icon
					secondary
					@click="expandedItems = [...rowIds]"
				>
					<VIcon name="unfold_more" />
				</VButton>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list {
	@include mixins.list-interface;

	--v-list-padding: 0 0 0.25rem;

	&.dragging {
		user-select: none;
	}
}

.list-item {
	--list-item-header-padding-inline: var(--theme--form--field--input--padding);
	--v-list-item-padding: 0;

	inline-size: 100%;
	margin-block-end: 0.5rem;

	&:has(.list-item-trigger:focus-visible):not(:has(.item-actions :focus-visible)) {
		border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus)) !important;
		outline: var(--focus-ring-width) solid var(--focus-ring-color, var(--theme--primary)) !important;
		outline-offset: var(--focus-ring-offset) !important;
		border-radius: var(--focus-ring-radius) !important;
	}
}

.list-item.dense {
	--list-item-header-padding-inline: calc(var(--theme--form--field--input--padding) / 2);
}

.list-item-header {
	box-sizing: border-box;
	inline-size: 100%;
	block-size: var(--theme--form--field--input--height);
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding-inline: var(--list-item-header-padding-inline);
}

.list-item-trigger {
	display: flex;
	flex: 1;
	align-items: center;
	align-self: stretch;
	block-size: 100%;
	gap: 0.5rem;
	min-inline-size: 0;
	cursor: pointer;
	border: none;
	background: none;
	padding: 0;
	transition: opacity 0.2s ease;

	&:focus-visible {
		outline: none !important;
		border-radius: 0 !important;
	}
}

.list-item-header-controls {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.list-item-content {
	inline-size: 100%;
}

.list-item-header-content {
	flex: 1;
	min-inline-size: 0;
}

.list-item-form {
	padding: var(--theme--form--field--input--padding);
	inline-size: 100%;
}

.border-bottom {
	&::after {
		position: absolute;
		inset-inline: 0;
		inset-block-end: 0;
		border-block-end: var(--theme--border-width) solid var(--theme--border-color);
		content: '';
	}
}

.item-actions {
	@include mixins.list-interface-item-actions;

	flex-shrink: 0;
}

.drag-handle {
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
}

.action-bar {
	margin-block-start: 0.5rem;
	display: flex;
	gap: 0.5rem;

	&.justify-between {
		justify-content: space-between;
	}
}
</style>
