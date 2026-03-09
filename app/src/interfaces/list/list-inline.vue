<script setup lang="ts">
defineOptions({ inheritAttrs: false });

import formatTitle from '@directus/format-title';
import { DeepPartial, Field } from '@directus/types';
import { sortBy } from 'lodash';
import { AccordionContent, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui';
import { computed, nextTick, ref, toRefs, watch } from 'vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VNotice from '@/components/v-notice.vue';
import { useInjectNestedValidation } from '@/composables/use-nested-validation';
import RenderTemplate from '@/views/private/components/render-template.vue';
import Draggable from 'vuedraggable';

const props = withDefaults(
	defineProps<{
		value: Record<string, unknown>[] | null;
		field?: string;
		fields?: DeepPartial<Field>[];
		template?: string;
		addLabel?: string;
		sort?: string;
		limit?: number;
		disabled?: boolean;
		nonEditable?: boolean;
		headerPlaceholder?: string;
		collection?: string;
		placeholder?: string;
		direction?: string;
		showConfirmDiscard?: boolean;
	}>(),
	{
		fields: () => [],
		showConfirmDiscard: true,
	},
);

const emit = defineEmits<{
	(e: 'input', value: Record<string, unknown>[] | null): void;
}>();

const { value } = toRefs(props);

const templateWithDefaults = computed(() =>
	props.fields?.[0]?.field ? props.template || `{{${props.fields[0].field}}}` : '',
);

const fieldsWithNames = computed(() =>
	props.fields
		?.map((field) => {
			if (!field || !field.field) return null;

			return {
				...field,
				name: formatTitle(field.name ?? field.field!),
			};
		})
		.filter(Boolean),
);

const showAddNew = computed(() => {
	if (props.disabled || props.nonEditable || fieldsWithNames.value.length === 0) return false;
	if (props.value === null) return true;
	if (props.limit === undefined) return true;
	if (Array.isArray(props.value) && props.value.length < props.limit) return true;
	return false;
});

const defaults = computed(() => {
	const values: Record<string, any> = {};

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

const expandedItems = ref<number[]>([]);
const draggedItemIndex = ref<number | null>(null);
const isDragging = ref(false);

function isExpanded(index: number) {
	return expandedItems.value.includes(index);
}

function onDragStart(evt: any) {
	draggedItemIndex.value = evt.oldIndex;
	isDragging.value = true;
}

function onDragEnd(evt: any) {
	if (draggedItemIndex.value !== null && evt.newIndex !== evt.oldIndex) {
		const oldIndex = draggedItemIndex.value;
		const newIndex = evt.newIndex;

		const updatedExpandedItems = expandedItems.value.map((expandedIndex) => {
			if (expandedIndex === oldIndex) return newIndex;

			if (oldIndex < newIndex) {
				if (expandedIndex > oldIndex && expandedIndex <= newIndex) return expandedIndex - 1;
			} else {
				if (expandedIndex >= newIndex && expandedIndex < oldIndex) return expandedIndex + 1;
			}

			return expandedIndex;
		});

		expandedItems.value = updatedExpandedItems;
	}

	draggedItemIndex.value = null;
	isDragging.value = false;
}

const itemToRemove = ref<number | null>(null);
const confirmDiscard = ref(false);

const { updateNestedValidationErrors } = useInjectNestedValidation();

const itemValidationErrors = computed<Record<number, any[]>>(() => {
	const errorsMap: Record<number, any[]> = {};

	internalValue.value?.forEach((item, index) => {
		const errors: any[] = [];

		for (const field of props.fields ?? []) {
			if (!field.field || !field.meta?.required) continue;

			const val = item[field.field];

			const isEmpty =
				val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);

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
	if (props.showConfirmDiscard) {
		itemToRemove.value = index;
		confirmDiscard.value = true;
		return;
	}

	performRemoval(index);
}

function performRemoval(index: number) {
	const newValue = internalValue.value?.filter((_, i) => i !== index);
	emitValue(newValue);

	const expandedIndex = expandedItems.value.indexOf(index);

	if (expandedIndex !== -1) {
		expandedItems.value.splice(expandedIndex, 1);
	}
}

function addNew() {
	const newDefaults: any = {};

	for (const field of props.fields) {
		newDefaults[field.field!] = field.schema?.default_value;
	}

	if (Array.isArray(internalValue.value)) {
		const newIndex = internalValue.value.length;
		emitValue([...internalValue.value, newDefaults]);
		expandedItems.value.push(newIndex);

		nextTick(() => {
			const forms = document.querySelectorAll('.list-item-form');
			const lastForm = Array.from(forms).at(-1);
			const firstInput = lastForm?.querySelector('input, select, textarea');

			if (firstInput instanceof HTMLElement) {
				firstInput.focus();
			}
		});
	} else {
		if (internalValue.value != null) {
			console.warn(
				'The repeater interface expects an array as value, but the given value is no array. Overriding given value.',
			);
		}

		emitValue([newDefaults]);
		expandedItems.value = [0];

		nextTick(() => {
			const firstInput = document.querySelector(
				'.list-item-form input, .list-item-form select, .list-item-form textarea',
			);

			if (firstInput instanceof HTMLElement) {
				firstInput.focus();
			}
		});
	}
}

function emitValue(value?: Record<string, unknown>[]) {
	if (!value || value.length === 0) {
		return emit('input', null);
	}

	return emit('input', value);
}

function discardAndLeave() {
	if (itemToRemove.value !== null) {
		performRemoval(itemToRemove.value);
		itemToRemove.value = null;
	}

	confirmDiscard.value = false;
}

const menuActive = computed(() => confirmDiscard.value);
</script>

<template>
	<div v-prevent-focusout="menuActive" class="repeater">
		<VNotice v-if="fieldsWithNames.length === 0" type="warning">
			{{ $t('no_visible_fields_copy') }}
		</VNotice>
		<VNotice v-else-if="!internalValue?.length">
			{{ placeholder || $t('no_items') }}
		</VNotice>
		<VNotice v-else-if="!Array.isArray(internalValue)" type="warning">
			{{ $t('interfaces.list.incompatible_data') }}
		</VNotice>

		<AccordionRoot v-else v-model="expandedItems" type="multiple">
			<Draggable
				v-if="Array.isArray(internalValue) && internalValue.length > 0"
				tag="v-list"
				:model-value="internalValue"
				:disabled="disabled || nonEditable"
				item-key="id"
				handle=".drag-handle"
				v-bind="{ 'force-fallback': true }"
				class="v-list"
				:class="{ dragging: isDragging }"
				@start="onDragStart"
				@end="onDragEnd"
				@update:model-value="$emit('input', $event)"
			>
				<template #item="{ element, index }">
					<AccordionItem :value="index" as-child>
						<VListItem :dense="internalValue.length > 4" block grow class="list-item">
							<div class="list-item-content">
								<AccordionTrigger as-child>
									<button
										type="button"
										class="list-item-header"
										:class="{ 'border-bottom': isExpanded(index) }"
									>
										<div class="list-item-header-controls">
											<VIcon
												v-if="!disabled && !nonEditable && !sort"
												name="drag_handle"
												class="drag-handle"
												@click.stop
											/>
											<VIcon
												:name="isExpanded(index) ? 'expand_less' : 'chevron_right'"
												class="expand-icon"
											/>
										</div>
										<RenderTemplate
											:fields="fields"
											:item="{ ...defaults, ...element }"
											:direction="direction"
											:template="templateWithDefaults"
											class="list-item-header-content"
										/>
										<VIcon
											v-if="!disabled && !nonEditable"
											name="close"
											class="clear-icon"
											clickable
											@click.stop="removeItem(index)"
										/>
									</button>
								</AccordionTrigger>
								<transition-expand>
									<AccordionContent as-child>
										<div class="list-item-form">
											<VForm
												:disabled="disabled"
												:non-editable="nonEditable"
												:fields="fieldsWithNames"
												:model-value="element"
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
								</transition-expand>
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

			<div v-if="internalValue" class="action-bar">
				<VButton
					v-tooltip="$t('collapse_all')"
					:disabled="expandedItems.length === 0"
					icon
					kind="secondary"
					@click="expandedItems = []"
				>
					<VIcon name="unfold_less" />
				</VButton>

				<VButton
					v-tooltip="$t('expand_all')"
					:disabled="expandedItems.length === internalValue.length"
					icon
					kind="secondary"
					@click="expandedItems = Array.from({ length: internalValue.length }, (_, i) => i)"
				>
					<VIcon name="unfold_more" />
				</VButton>
			</div>
		</div>

		<VDialog v-model="confirmDiscard" @esc="confirmDiscard = false">
			<VCard>
				<VCardTitle>{{ $t('remove_item') }}</VCardTitle>
				<VCardText>{{ $t('remove_item_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="confirmDiscard = false">
						{{ $t('cancel') }}
					</VButton>
					<VButton kind="danger" @click="discardAndLeave()">
						{{ $t('remove_item') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list {
	@include mixins.list-interface;

	--v-list-padding: 0 0 4px;
}

.list-item {
	width: 100%;
	margin-bottom: 8px;

	&:has(.list-item-header:focus-visible):not(:has(.clear-icon:focus-visible)) {
		border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus)) !important;
		outline: var(--focus-ring-width) solid var(--focus-ring-color, var(--theme--primary)) !important;
		outline-offset: var(--focus-ring-offset) !important;
		border-radius: var(--focus-ring-radius) !important;
	}
}

.list-item-header {
	width: 100%;
	display: flex;
	cursor: pointer;
	align-items: center;
	gap: 8px;
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
	gap: 4px;
}

.list-item-content {
	width: 100%;
}

.list-item-header-content {
	display: inline-flex;
	flex: 1;
}

.list-item-form {
	margin-top: 16px;
	width: 100%;
}

.border-bottom {
	padding-bottom: 8px;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
}

.clear-icon {
	--v-icon-color: var(--theme--form--field--input--foreground-subdued);
	--v-icon-color-hover: var(--theme--danger);
}

.drag-handle {
	cursor: move;
	opacity: 0.5;
	transition: opacity var(--fast) var(--transition);

	&:hover {
		opacity: 1;
	}
}

.action-bar {
	margin-top: 8px;
	display: flex;
	gap: 8px;

	&.justify-between {
		justify-content: space-between;
	}
}
</style>
