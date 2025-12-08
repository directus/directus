<script setup lang="ts">
import UseDatetime, { type Props as UseDatetimeProps } from '@/components/use-datetime.vue';
import { parseDate } from '@/utils/parse-date';
import { isValid, parseISO } from 'date-fns';
import { computed, ref } from 'vue';

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

const dateTimeMenu = ref();
const isValidValue = computed(() => (props.value ? isValid(parseDate(props.value, props.type)) : false));

/**
 * Converts a date-picker ISO value (which represents time in selected timezone) back to UTC.
 * The date-picker emits an ISO string, but we need to interpret it as being in the selected timezone.
 */
function convertDateBetweenTZorUTC(isoValue: string | null, timezone: string | null, toUTC = true): string | null {
	if (!isoValue || !timezone || props.type !== 'timestamp') {
		return isoValue;
	}

	try {
		const date = parseISO(isoValue);

		if (!isValid(date)) return isoValue;

		// Format this UTC date in the target timezone to see what it shows
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});

		// Get the date components from the ISO value (these represent time in the selected timezone)
		const year = date.getUTCFullYear();
		const month = date.getUTCMonth();
		const day = date.getUTCDate();
		const hour = date.getUTCHours();
		const minute = date.getUTCMinutes();
		const second = date.getUTCSeconds();

		// Create a UTC date with these components
		const desiredUtc = new Date(Date.UTC(year, month, day, hour, minute, second));

		const parts = formatter.formatToParts(desiredUtc);
		const partsMap: Record<string, string> = {};

		for (const part of parts) {
			partsMap[part.type] = part.value;
		}

		// Calculate the difference between what we want and what we got
		const actualTime = new Date(
			parseInt(partsMap.year!),
			parseInt(partsMap.month!) - 1,
			parseInt(partsMap.day!),
			parseInt(partsMap.hour!),
			parseInt(partsMap.minute!),
			parseInt(partsMap.second!),
		).getTime();

		const desiredTime = new Date(year, month, day, hour, minute, second).getTime();
		const diffMs = desiredTime - actualTime;

		// Adjust the UTC date by the difference
		const adjustedUtc = new Date(desiredUtc.getTime() + (toUTC ? -diffMs : diffMs));

		return adjustedUtc.toISOString();
	} catch {
		return isoValue;
	}
}

function unsetValue(e: any) {
	e.preventDefault();
	e.stopPropagation();
	emit('input', null);
}

// Computed property for date-picker value with timezone conversion
const tzValue = computed({
	get() {
		// Convert UTC value to timezone-adjusted value for date-picker display
		if (props.type === 'timestamp' && props.tz && props.value) {
			return convertDateBetweenTZorUTC(props.value, props.tz, false) || '';
		}

		return props.value || '';
	},
	set(value: string | null) {
		if (!value) {
			emit('input', null);
			return;
		}

		// Convert date-picker value back to UTC considering the selected timezone
		if (props.type === 'timestamp' && props.tz) {
			const adjustedValue = convertDateBetweenTZorUTC(value, props.tz, true);
			emit('input', adjustedValue);
			return;
		}

		emit('input', value);
	},
});
</script>

<template>
	<v-menu ref="dateTimeMenu" :close-on-content-click="false" attached :disabled="disabled" full-height seamless>
		<template #activator="{ toggle, active }">
			<v-list-item block clickable :disabled :active @click="toggle">
				<template v-if="isValidValue">
					<use-datetime v-slot="{ datetime }" v-bind="$props as UseDatetimeProps">
						{{ datetime }}
					</use-datetime>
				</template>

				<div class="spacer" />

				<template v-if="!disabled">
					<v-icon
						v-if="tz"
						v-tooltip="tz"
						name="schedule"
						class="timezone-icon"
					/>

					<v-icon
						:name="value ? 'clear' : 'today'"
						:class="{ active, 'clear-icon': value, 'today-icon': !value }"
						clickable
						@click="value ? unsetValue($event) : undefined"
					/>
				</template>
			</v-list-item>
		</template>

		<v-date-picker
			v-model="tzValue"
			:type
			:disabled
			:include-seconds
			:use-24
			@close="dateTimeMenu?.deactivate"
		/>
	</v-menu>
</template>

<style lang="scss" scoped>
.v-list-item {
	--v-list-item-color-active: var(--v-list-item-color);
	--v-list-item-background-color-active: var(
		--v-list-item-background-color,
		var(--v-list-background-color, var(--theme--form--field--input--background))
	);

	&.active,
	&:focus-within,
	&:focus-visible {
		--v-list-item-border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus));
		--v-list-item-border-color-hover: var(--v-list-item-border-color);

		offset: 0;
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}

.v-icon {
	&.today-icon {
		&:hover,
		&.active {
			--v-icon-color: var(--theme--primary);
		}
	}

	&.clear-icon {
		&:hover,
		&.active {
			--v-icon-color: var(--theme--danger);
		}
	}

	&.timezone-icon {
		margin-inline-end: 4px;

		--v-icon-color: var(--theme--secondary);
	}
}
</style>
