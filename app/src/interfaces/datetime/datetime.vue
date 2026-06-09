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

// Whether the trigger is currently in inline keyboard-edit mode (segments shown instead of the template).
const isEditing = ref(false);

const isValidValue = computed(() => (props.value ? isValid(parseDate(props.value, props.type)) : false));

// Dynamic variables (e.g. $NOW, $CURRENT_USER.date_created) can't be shown as editable segments.
const isDynamic = computed(() => !!props.value && isDynamicVariable(props.value));

// Inline editing covers the date for date/dateTime/timestamp. The `time` type stays popup-only,
// and dynamic-variable values fall back to opening the popup (segments can't represent them).
const canEditInline = computed(
	() => props.type !== 'time' && !props.disabled && !props.nonEditable && !isDynamic.value,
);

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
	if (props.disabled || props.nonEditable) return;

	if (canEditInline.value) {
		isEditing.value = true;
	} else {
		dateTimeMenu.value?.activate?.();
	}
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
				<div class="value" @click="onValueClick">
					<DatePickerField
						v-if="isEditing"
						:type="type"
						:model-value="tzValue"
						:include-seconds="includeSeconds"
						:disabled="disabled"
						autofocus
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
