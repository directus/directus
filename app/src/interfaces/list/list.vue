<script setup lang="ts">
import { renderStringTemplate } from '@/utils/render-string-template';
import formatTitle from '@directus/format-title';
import { DeepPartial, Field, FieldMeta } from '@directus/types';
import { isEqual, sortBy } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import Draggable from 'vuedraggable';

const props = withDefaults(
	defineProps<{
		value: Record<string, unknown>[] | null;
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
	}>(),
	{
		fields: () => [],
	},
);

const emit = defineEmits<{
	(e: 'input', value: FieldMeta[] | null): void;
}>();

const active = ref<number | null>(null);
const drawerOpen = computed(() => active.value !== null);
const { value } = toRefs(props);

const templateWithDefaults = computed(() =>
	props.fields?.[0]?.field ? props.template || `{{${props.fields[0].field}}}` : '',
);

const showAddNew = computed(() => {
	if (props.value === null) return true;
	if (props.limit === undefined) return true;
	if (Array.isArray(props.value) && props.value.length < props.limit) return true;
	return false;
});

const activeItem = computed(() => (active.value !== null ? edits.value : null));

const isSaveDisabled = computed(() => {
	if (props.disabled) return true;

	for (const field of props.fields) {
		if (
			field.meta?.required &&
			field.field &&
			(edits.value[field.field] === null || edits.value[field.field] === undefined)
		) {
			return true;
		}
	}

	return false;
});

const { displayValue } = renderStringTemplate(templateWithDefaults, activeItem);

const defaults = computed(() => {
	const values: Record<string, any> = {};

	for (const field of props.fields) {
		if (field.schema?.default_value !== undefined && field.schema?.default_value !== null) {
			values[field.field!] = field.schema.default_value;
		}
	}

	return values;
});

const fieldsWithNames = computed(() =>
	props.fields?.map((field) => {
		return {
			...field,
			name: formatTitle(field.name ?? field.field!),
		};
	}),
);

const internalValue = computed({
	get: () => {
		if (props.fields && props.sort) return sortBy(value.value, props.sort);
		return value.value;
	},
	set: (newVal) => {
		value.value = props.fields && props.sort ? sortBy(value.value, props.sort) : newVal;
	},
});

const isNewItem = ref(false);
const edits = ref({} as Record<string, any>);
const confirmDiscard = ref(false);

function openItem(index: number) {
	isNewItem.value = false;

	edits.value = { ...internalValue.value?.[index] };
	active.value = index;
}

function saveItem(index: number) {
	if (isSaveDisabled.value) return;

	isNewItem.value = false;

	updateValues(index, edits.value);
	closeDrawer();
}

function trackEdits(updatedValues: any) {
	const combinedValues = Object.assign({}, defaults.value, updatedValues);
	Object.assign(edits.value, combinedValues);
}

function checkDiscard() {
	if (active.value !== null && !isEqual(edits.value, internalValue.value?.[active.value])) {
		confirmDiscard.value = true;
	} else {
		closeDrawer();
	}
}

function discardAndLeave() {
	closeDrawer();
	confirmDiscard.value = false;
}

function updateValues(index: number, updatedValues: any) {
	const newValue = internalValue.value?.map((item: any, i: number) => {
		if (i === index) {
			return updatedValues;
		}

		return item;
	});

	if (props.fields && props.sort) {
		emitValue(sortBy(newValue, props.sort));
	} else {
		emitValue(newValue);
	}
}

function removeItem(item: Record<string, any>) {
	if (value.value) {
		emitValue(internalValue.value?.filter((i) => i !== item));
	} else {
		emitValue();
	}
}

function addNew() {
	isNewItem.value = true;

	const newDefaults: any = {};

	props.fields.forEach((field) => {
		newDefaults[field.field!] = field.schema?.default_value;
	});

	if (Array.isArray(internalValue.value)) {
		emitValue([...internalValue.value, newDefaults]);
	} else {
		if (internalValue.value != null) {
			// eslint-disable-next-line no-console
			console.warn(
				'The repeater interface expects an array as value, but the given value is no array. Overriding given value.',
			);
		}

		emitValue([newDefaults]);
	}

	edits.value = { ...newDefaults };
	active.value = (internalValue.value || []).length;
}

function emitValue(value?: Record<string, unknown>[]) {
	if (!value || value.length === 0) {
		return emit('input', null);
	}

	return emit('input', value);
}

function closeDrawer() {
	if (isNewItem.value) {
		emitValue(internalValue.value?.slice(0, -1));
	}

	edits.value = {};
	active.value = null;
}

const menuActive = computed(() => drawerOpen.value || confirmDiscard.value);
</script>

<template>
	<div v-prevent-focusout="menuActive" class="repeater">
		<v-notice v-if="(Array.isArray(internalValue) && internalValue.length === 0) || internalValue == null">
			{{ placeholder || $t('no_items') }}
		</v-notice>
		<v-notice v-else-if="!Array.isArray(internalValue)" type="warning">
			<p>{{ $t('interfaces.list.incompatible_data') }}</p>
		</v-notice>

		<draggable
			v-if="Array.isArray(internalValue) && internalValue.length > 0"
			tag="v-list"
			:disabled="disabled"
			:model-value="internalValue"
			item-key="id"
			handle=".drag-handle"
			v-bind="{ 'force-fallback': true }"
			@update:model-value="$emit('input', $event)"
		>
			<template #item="{ element, index }">
				<v-list-item :dense="internalValue.length > 4" :non-editable block clickable @click="openItem(index)">
					<v-icon v-if="!disabled && !sort" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />

					<render-template
						:fields="fields"
						:item="{ ...defaults, ...element }"
						:direction="direction"
						:template="templateWithDefaults"
					/>

					<div class="spacer" />

					<div class="item-actions">
						<v-remove v-if="!disabled" confirm @action="removeItem(element)" />
					</div>
				</v-list-item>
			</template>
		</draggable>

		<div v-if="!nonEditable" class="actions">
			<v-button v-if="showAddNew" :disabled @click="addNew">
				{{ addLabel || $t('create_new') }}
			</v-button>
		</div>

		<v-drawer
			:model-value="drawerOpen"
			:title="displayValue || headerPlaceholder || $t('empty_item')"
			persistent
			@update:model-value="checkDiscard()"
			@cancel="checkDiscard()"
			@apply="saveItem(active!)"
		>
			<template #title>
				<h1 class="type-title">
					<render-template :fields="fields" :item="activeItem" :template="templateWithDefaults" />
				</h1>
			</template>

			<template #actions>
				<v-button v-tooltip.bottom="$t('save')" icon rounded :disabled="isSaveDisabled" @click="saveItem(active!)">
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="drawer-item-content">
				<v-form
					:disabled
					:non-editable
					:fields="fieldsWithNames"
					:model-value="activeItem"
					:direction
					autofocus
					primary-key="+"
					@update:model-value="trackEdits($event)"
				/>
			</div>
		</v-drawer>

		<v-dialog v-model="confirmDiscard" @esc="confirmDiscard = false" @apply="discardAndLeave">
			<v-card>
				<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ $t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave()">
						{{ $t('discard_changes') }}
					</v-button>
					<v-button @click="confirmDiscard = false">{{ $t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list {
	@include mixins.list-interface;
}

.item-actions {
	@include mixins.list-interface-item-actions;
}

.actions {
	@include mixins.list-interface-actions;
}

.drawer-item-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>
