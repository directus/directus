<script setup lang="ts">
import UseDatetime, { type Props as UseDatetimeProps } from '@/components/use-datetime.vue';
import { parseDate } from '@/utils/parse-date';
import { formatDateToTimezone, getLocalTimezoneOffset } from '@/utils/timezones';
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
			const date = parseISO(props.value);
			if (!isValid(date)) return null;
			return formatDateToTimezone(date, props.tz).toISOString();
		}

		return props.value;
	},
	set(value: string | null) {
		if (!value) {
			emit('input', null);
			return;
		}

		// Convert date-picker value back to UTC considering the selected timezone
		const date = parseISO(value);

		if (isValid(date) && props.type === 'timestamp' && props.tz) {
			const offset = getLocalTimezoneOffset(date, props.tz);
			date.setHours(date.getHours() - offset);
			emit('input', date.toISOString());
			return;
		}

		emit('input', value);
	},
});
</script>

<template>
	<v-menu ref="dateTimeMenu" :close-on-content-click="false" attached :disabled="disabled" full-height seamless>
		<template #activator="{ toggle, active }">
			<v-list-item block clickable :disabled :non-editable :active @click="toggle">
				<template v-if="isValidValue">
					<use-datetime v-slot="{ datetime }" v-bind="$props as UseDatetimeProps">
						{{ datetime }}
					</use-datetime>
				</template>

				<div class="spacer" />

				<template v-if="!disabled">
					<v-icon v-if="tz" v-tooltip="tz" small name="schedule" class="timezone-icon" />

					<v-icon
						:name="value ? 'clear' : 'today'"
						:class="{ active, 'clear-icon': value, 'today-icon': !value }"
						clickable
						@click="value ? unsetValue($event) : undefined"
					/>
				</template>
			</v-list-item>
		</template>

		<v-date-picker v-model="tzValue" :type :disabled :include-seconds :use-24 @close="dateTimeMenu?.deactivate" />
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
