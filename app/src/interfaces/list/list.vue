<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { DeepPartial, Field, FieldMeta } from '@directus/types';
import { isEqual, sortBy } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import Draggable from 'vuedraggable';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VDrawer from '@/components/v-drawer.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VNotice from '@/components/v-notice.vue';
import VRemove from '@/components/v-remove.vue';
import { renderStringTemplate } from '@/utils/render-string-template';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import RenderTemplate from '@/views/private/components/render-template.vue';

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
</script>

<template>
	<div class="repeater">
		<VNotice v-if="(Array.isArray(internalValue) && internalValue.length === 0) || internalValue == null">
			{{ placeholder || $t('no_items') }}
		</VNotice>
		<VNotice v-else-if="!Array.isArray(internalValue)" type="warning">
			<p>{{ $t('interfaces.list.incompatible_data') }}</p>
		</VNotice>

		<Draggable
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
				<VListItem :dense="internalValue.length > 4" :non-editable block clickable @click="openItem(index)">
					<VIcon v-if="!disabled && !sort" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />

					<RenderTemplate
						:fields="fields"
						:item="{ ...defaults, ...element }"
						:direction="direction"
						:template="templateWithDefaults"
					/>

					<div class="spacer" />

					<div class="item-actions">
						<VRemove v-if="!disabled" confirm @action="removeItem(element)" />
					</div>
				</VListItem>
			</template>
		</Draggable>

		<div v-if="!nonEditable" class="actions">
			<VButton v-if="showAddNew" :disabled @click="addNew">
				{{ addLabel || $t('create_new') }}
			</VButton>
		</div>

		<VDrawer
			:model-value="drawerOpen"
			:title="displayValue || headerPlaceholder || $t('empty_item')"
			persistent
			@update:model-value="checkDiscard()"
			@cancel="checkDiscard()"
			@apply="saveItem(active!)"
		>
			<template #title>
				<h1 class="type-title">
					<RenderTemplate :fields="fields" :item="activeItem" :template="templateWithDefaults" />
				</h1>
			</template>

			<template #actions>
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('save')"
					icon="check"
					:disabled="isSaveDisabled"
					@click="saveItem(active!)"
				/>
			</template>

			<div class="drawer-item-content">
				<VForm
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
		</VDrawer>

		<VDialog v-model="confirmDiscard" @esc="confirmDiscard = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave()">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmDiscard = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
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
