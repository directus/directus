<script setup lang="ts">
import { isDynamicVariable } from '@directus/utils';
import { isValid, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { computed, ref, useTemplateRef } from 'vue';
import DatePickerField from './date-picker-field.vue';
import UseDatetime, { type Props as UseDatetimeProps } from '@/components/use-datetime.vue';
import VDatePicker from '@/components/v-date-picker/v-date-picker.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VMenu from '@/components/v-menu.vue';
import VRemove from '@/components/v-remove.vue';
import { parseDate } from '@/utils/parse-date';

interface Props extends Omit<UseDatetimeProps, 'value'> {
	value: string | null;
	disabled?: boolean;
	nonEditable?: boolean;
	tz?: string;
}

const props = withDefaults(defineProps<Props>(), {
	use24: true,
	format: 'long',
	relative: false,
	strict: false,
	round: 'round',
	suffix: true,
});

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const menuActive = ref(false);
const dateTimeMenu = useTemplateRef('dateTimeMenu');

// Inline keyboard-edit mode: editable segments shown instead of the formatted value.
const isEditing = ref(false);

const isValidValue = computed(() => (props.value ? isValid(parseDate(props.value, props.type)) : false));

const isDynamic = computed(() => !!props.value && isDynamicVariable(props.value));

const isInteractive = computed(() => !props.disabled && !props.nonEditable);

const canEditInline = computed(() => isInteractive.value && !isDynamic.value);

// Show the inline segments while editing, and as a placeholder when there's no value yet.
const showInlineField = computed(() => isEditing.value || (canEditInline.value && !isValidValue.value));

const valueTabindex = computed(() => (isInteractive.value && !showInlineField.value ? 0 : undefined));

function unsetValue(e: Event) {
	e.preventDefault();
	e.stopPropagation();
	isEditing.value = false;
	emit('input', null);
}

function closeDatePicker() {
	dateTimeMenu.value?.deactivate();
}

/** Clicking the value region enters inline edit mode, or opens the popup when inline edit isn't possible. */
function onValueClick() {
	if (!isInteractive.value) return;

	if (canEditInline.value) {
		isEditing.value = true;
	} else {
		dateTimeMenu.value?.activate?.();
	}
}

// Enter/Space on the value region acts like a click; the calendar icon stays the way to open the
// popup. The target guard ignores events bubbling up from the segments while editing.
function onValueKeydown(event: KeyboardEvent) {
	if (event.target !== event.currentTarget) return;
	if (event.key !== 'Enter' && event.key !== ' ') return;
	if (!isInteractive.value) return;

	event.preventDefault();
	onValueClick();
}

// Focusing a placeholder segment counts as editing, so typing holds the field open as the value becomes valid.
function onValueFocusin(event: FocusEvent) {
	if (event.target === event.currentTarget) return;
	if (canEditInline.value) isEditing.value = true;
}

/** Leave edit mode once focus moves outside the inline field (segment-to-segment moves stay in edit mode). */
function onFieldFocusout(event: FocusEvent) {
	const next = event.relatedTarget as Node | null;
	if (next && event.currentTarget instanceof Node && event.currentTarget.contains(next)) return;
	isEditing.value = false;
}

// Computed property for date-picker value with timezone conversion
const tzValue = computed({
	get() {
		if (props.type === 'timestamp' && props.tz && props.value) {
			const date = parseISO(props.value);
			if (!isValid(date)) return null;
			return toZonedTime(date, props.tz).toISOString();
		}

		return props.value;
	},
	set(value: string | null) {
		if (!value) {
			emit('input', null);
			return;
		}

		const date = parseISO(value);

		if (isValid(date) && props.type === 'timestamp' && props.tz) {
			emit('input', fromZonedTime(date, props.tz).toISOString());
			return;
		}

		emit('input', value);
	},
});
</script>

<template>
	<VMenu
		ref="dateTimeMenu"
		v-model="menuActive"
		v-prevent-focusout="menuActive"
		:close-on-content-click="false"
		attached
		:disabled="disabled"
		full-height
		seamless
	>
		<template #activator="{ toggle, active }">
			<VListItem block activator :disabled :non-editable :active>
				<div
					class="value"
					:tabindex="valueTabindex"
					:role="valueTabindex !== undefined ? 'button' : undefined"
					:aria-label="valueTabindex !== undefined ? $t('interfaces.datetime.datetime') : undefined"
					@click="onValueClick"
					@keydown="onValueKeydown"
					@focusin="onValueFocusin"
				>
					<DatePickerField
						v-if="showInlineField"
						:type="type"
						:model-value="tzValue"
						:include-seconds="includeSeconds"
						:use-24="use24"
						:disabled="disabled"
						:autofocus="isEditing"
						@update:model-value="tzValue = $event"
						@focusout="onFieldFocusout"
					/>
					<UseDatetime v-else-if="isValidValue" v-slot="{ datetime }" v-bind="$props as UseDatetimeProps">
						{{ datetime }}
					</UseDatetime>
				</div>

				<div v-if="!nonEditable" class="item-actions">
					<VIcon v-if="tz" v-tooltip="tz" name="schedule" class="timezone-icon" :class="{ active, disabled }" />
					<VRemove v-if="value" :disabled deselect class="clear-icon" @action="unsetValue($event)" />
					<VIcon
						v-tooltip="$t('interfaces.datetime.datetime')"
						name="today"
						class="today-icon"
						:class="{ active, disabled }"
						clickable
						@click.stop="toggle"
					/>
				</div>
			</VListItem>
		</template>

		<VDatePicker
			:type
			:disabled
			:include-seconds
			:use-24
			:model-value="tzValue"
			@update:model-value="tzValue = $event"
			@close="closeDatePicker"
		/>
	</VMenu>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list-item {
	--v-list-item-color-active: var(--v-list-item-color);
	--v-list-item-background-color-active: var(
		--v-list-item-background-color,
		var(--v-list-background-color, var(--theme--form--field--input--background))
	);

	&.disabled:not(.non-editable) {
		--v-list-item-background-color: var(--theme--form--field--input--background-subdued);
	}

	&.active:not(.disabled),
	&:focus-within,
	&:focus-visible {
		outline: var(--focus-ring-width) solid var(--theme--form--field--input--focus-ring-color);
		outline-offset: var(--focus-ring-offset-invert);
	}
}

.value {
	display: flex;
	flex: 1 1 auto;
	align-items: center;
	min-inline-size: 0;
	min-block-size: var(--theme--form--field--input--height, 1.5rem);
	cursor: text;

	// Suppress the default outline; the list item's :focus-within already shows the focus ring.
	&:focus,
	&:focus-visible {
		outline: none;
	}
}

.v-list-item.disabled .value,
.v-list-item.non-editable .value {
	cursor: default;
}

.today-icon:not(.disabled) {
	&:hover,
	&.active {
		--v-icon-color: var(--theme--primary);
	}
}

.timezone-icon {
	margin-inline-end: 0.25rem;
}

.item-actions {
	@include mixins.list-interface-item-actions;
}
</style>
