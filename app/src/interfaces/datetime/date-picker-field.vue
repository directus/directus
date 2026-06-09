<script setup lang="ts">
import { DateFieldInput, DateFieldRoot } from 'reka-ui';
import { computed, nextTick, onMounted, useTemplateRef } from 'vue';
import { type PickerType, useDatePickerValue } from '@/components/v-date-picker/use-date-picker-value';
import { useUserStore } from '@/stores/user';

interface Props {
	type: PickerType;
	modelValue?: string | null;
	disabled?: boolean;
	includeSeconds?: boolean;
	/** Focus the first editable segment on mount (used when swapping in on click/focus). */
	autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	disabled: false,
	includeSeconds: false,
	autofocus: false,
});

const emit = defineEmits<{
	'update:modelValue': [value: string | null];
}>();

const userStore = useUserStore();

const dir = computed<'ltr' | 'rtl'>(() => (userStore.textDirection === 'rtl' ? 'rtl' : 'ltr'));

// Reuse the picker's value logic so this inline field and the popup calendar parse/format the
// same string identically. Editing only the date here preserves any existing time component.
const { calendarValue, handleDateFieldChange } = useDatePickerValue({
	type: () => props.type,
	modelValue: () => props.modelValue,
	includeSeconds: () => props.includeSeconds,
	onUpdate: (value) => emit('update:modelValue', value),
});

const root = useTemplateRef('root');

onMounted(() => {
	if (!props.autofocus || props.disabled) return;

	nextTick(() => {
		const el = root.value?.$el as HTMLElement | undefined;
		const segment = el?.querySelector('.date-field-segment');
		if (segment instanceof HTMLElement) segment.focus();
	});
});
</script>

<template>
	<DateFieldRoot
		ref="root"
		v-slot="{ segments }"
		:model-value="calendarValue"
		granularity="day"
		:locale="userStore.language"
		:disabled="disabled"
		:dir="dir"
		:aria-label="$t('interfaces.datetime.datetime')"
		class="date-field"
		@update:model-value="handleDateFieldChange"
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
</template>

<style lang="scss" scoped>
.date-field {
	display: flex;
	align-items: center;
	gap: 0.125rem;
	font-family: var(--theme--fonts--sans--font-family);
}

.date-field-segment {
	padding: 0.0625rem 0.1875rem;
	border-radius: var(--theme--border-radius);
	text-align: center;
}

.date-field-segment[data-placeholder] {
	color: var(--theme--foreground-subdued);
}

.date-field-segment:focus,
.date-field-segment:focus-visible {
	outline: none;
	color: var(--theme--primary);
	background: var(--theme--primary-background);
}
</style>
