<script setup lang="ts">
import type { DateValue } from '@internationalized/date';
import { DateFieldInput, DateFieldRoot, TimeFieldInput, TimeFieldRoot } from 'reka-ui';
import { computed, nextTick, onMounted, useTemplateRef } from 'vue';
import { type PickerType, useDatePickerValue } from '@/components/v-date-picker/use-date-picker-value';
import { useUserStore } from '@/stores/user';

interface Props {
	type: PickerType;
	modelValue?: string | null;
	disabled?: boolean;
	includeSeconds?: boolean;
	use24?: boolean;
	/** Focus the first editable segment on mount (used when swapping in on click/focus). */
	autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	disabled: false,
	includeSeconds: false,
	use24: true,
	autofocus: false,
});

const emit = defineEmits<{
	'update:modelValue': [value: string | null];
}>();

const userStore = useUserStore();

const dir = computed<'ltr' | 'rtl'>(() => (userStore.textDirection === 'rtl' ? 'rtl' : 'ltr'));

// Shared with the popup calendar so both parse/format the same string and configure their segments identically.
const { calendarValue, timeValue, hasTime, hourCycle, granularity, showCalendar, applyDate, applyTime } =
	useDatePickerValue({
		type: () => props.type,
		modelValue: () => props.modelValue,
		includeSeconds: () => props.includeSeconds,
		use24: () => props.use24,
		onUpdate: (value) => emit('update:modelValue', value),
	});

function onDateUpdate(value: DateValue | undefined) {
	if (value && value.year < 1000) return;
	applyDate(value);
}

const root = useTemplateRef('root');

onMounted(() => {
	if (!props.autofocus || props.disabled) return;

	nextTick(() => {
		const segment = root.value?.querySelector('.date-field-segment, .time-field-segment');
		if (segment instanceof HTMLElement) segment.focus();
	});
});
</script>

<template>
	<div ref="root" class="date-time-field">
		<DateFieldRoot
			v-if="showCalendar"
			v-slot="{ segments }"
			:model-value="calendarValue"
			granularity="day"
			:locale="userStore.language"
			:disabled="disabled"
			:dir="dir"
			:aria-label="$t('interfaces.datetime.datetime')"
			class="date-field"
			@update:model-value="onDateUpdate"
		>
			<template v-for="item in segments" :key="item.part">
				<DateFieldInput v-if="item.part === 'literal'" :part="item.part" class="date-field-literal">
					{{ item.value }}
				</DateFieldInput>
				<DateFieldInput v-else :part="item.part" class="date-field-segment">
					{{ item.value }}
				</DateFieldInput>
			</template>
		</DateFieldRoot>

		<TimeFieldRoot
			v-if="hasTime"
			v-slot="{ segments }"
			:model-value="timeValue"
			:granularity="granularity"
			:hour-cycle="hourCycle"
			:locale="userStore.language"
			:disabled="disabled"
			:dir="dir"
			:class="['time-field', { 'is-empty': !timeValue }]"
			@update:model-value="applyTime"
		>
			<template v-for="item in segments" :key="item.part">
				<TimeFieldInput v-if="item.part === 'literal'" :part="item.part" class="time-field-literal">
					{{ item.value }}
				</TimeFieldInput>
				<TimeFieldInput v-else :part="item.part" class="time-field-segment">
					{{ item.value }}
				</TimeFieldInput>
			</template>
		</TimeFieldRoot>
	</div>
</template>

<style lang="scss" scoped>
.date-time-field {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.date-field,
.time-field {
	display: flex;
	align-items: center;
	gap: 0.125rem;
	font-family: var(--theme--fonts--sans--font-family);
}

.date-field-segment,
.time-field-segment {
	padding: 0.0625rem 0.1875rem;
	border-radius: var(--theme--border-radius);
	text-align: center;
}

.date-field-segment[data-placeholder],
.time-field-segment[data-placeholder] {
	color: var(--theme--foreground-subdued);
}

// Placeholder for the time field when empty
.time-field.is-empty [data-reka-time-field-segment='dayPeriod'] {
	color: var(--theme--foreground-subdued);
}

.date-field-segment:focus,
.date-field-segment:focus-visible,
.time-field-segment:focus,
.time-field-segment:focus-visible {
	outline: none;
	color: var(--theme--primary);
	background: var(--theme--primary-background);
}
</style>
