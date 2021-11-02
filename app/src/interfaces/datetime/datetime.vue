<template>
	<v-menu :close-on-content-click="false" attached :disabled="disabled">
		<template #activator="{ toggle, active }">
			<v-input
				:active="active"
				clickable
				readonly
				:model-value="displayValue"
				:disabled="disabled"
				:placeholder="t('enter_a_value')"
				@click="toggle"
			>
				<template v-if="!disabled" #append>
					<v-icon :name="value ? 'close' : 'today'" :class="{ active }" @click.stop="unsetValue" />
				</template>
			</v-input>
		</template>

		<div v-if="type === 'timestamp' || type === 'dateTime' || type === 'date'" class="date-selects">
			<div class="month">
				<v-select v-model="month" :placeholder="t('month')" :items="monthItems" />
			</div>
			<div class="date">
				<v-select v-model="date" :placeholder="t('date')" :items="dateItems" />
			</div>
			<div class="year">
				<v-select v-model="year" :placeholder="t('year')" :items="yearItems" allow-other />
			</div>
		</div>

		<v-divider v-if="type === 'timestamp' || type === 'dateTime'" />

		<div
			v-if="type === 'timestamp' || type === 'dateTime' || type === 'time'"
			class="time-selects"
			:class="{ seconds: includeSeconds, 'use-24': use24 }"
		>
			<div class="hour">
				<v-select v-model="hours" :placeholder="t('hours')" :items="hourItems" />
			</div>
			<div class="minutes">
				<v-select v-model="minutes" :placeholder="t('minutes')" :items="minutesSecondItems" />
			</div>
			<div v-if="includeSeconds" class="seconds">
				<v-select v-model="seconds" :items="minutesSecondItems" />
			</div>
			<div v-if="use24 === false" class="period">
				<v-select v-model="period" :items="['am', 'pm']" />
			</div>
		</div>

		<v-divider />

		<button class="to-now" @click="setToNow">{{ t('interfaces.datetime.set_to_now') }}</button>
	</v-menu>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch, computed, PropType } from 'vue';
import formatLocalized from '@/utils/localized-format';
import { format, formatISO, parse, parseISO, setSeconds } from 'date-fns';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
		},
		type: {
			type: String as PropType<'timestamp' | 'dateTime' | 'time' | 'date'>,
			required: true,
			validator: (val: string) => ['dateTime', 'date', 'time', 'timestamp'].includes(val),
		},
		includeSeconds: {
			type: Boolean,
			default: false,
		},
		use24: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const { internalValue, year, month, date, hours, minutes, seconds, period } = useLocalValue();
		const { yearItems, monthItems, dateItems, hourItems, minutesSecondItems } = useOptions();
		const { displayValue } = useDisplayValue();

		return {
			t,
			year,
			month,
			date,
			hours,
			minutes,
			seconds,
			period,
			setToNow,
			yearItems,
			monthItems,
			dateItems,
			hourItems,
			minutesSecondItems,
			displayValue,
			unsetValue,
		};

		function unsetValue() {
			emit('input', null);
		}

		function useLocalValue() {
			const internalValue = computed({
				get() {
					if (!props.value) return null;

					if (props.type === 'timestamp') {
						return parseISO(props.value);
					} else if (props.type === 'dateTime') {
						return parse(props.value, "yyyy-MM-dd'T'HH:mm:ss", new Date());
					} else if (props.type === 'date') {
						return parse(props.value, 'yyyy-MM-dd', new Date());
					} else if (props.type === 'time') {
						return parse(props.value, 'HH:mm:ss', new Date());
					}

					return null;
				},
				set(newValue: Date | null) {
					if (newValue === null) return emit('input', null);

					if (props.type === 'timestamp') {
						emit('input', formatISO(newValue));
					} else if (props.type === 'dateTime') {
						emit('input', format(newValue, "yyyy-MM-dd'T'HH:mm:ss"));
					} else if (props.type === 'date') {
						emit('input', format(newValue, 'yyyy-MM-dd'));
					} else if (props.type === 'time') {
						emit('input', format(newValue, 'HH:mm:ss'));
					}
				},
			});

			const year = computed({
				get() {
					if (!internalValue.value) return null;
					return internalValue.value.getFullYear();
				},
				set(newYear: number | null) {
					const newValue = internalValue.value ? new Date(internalValue.value) : new Date(0);
					newValue.setFullYear(newYear || 0);
					internalValue.value = newValue;
				},
			});

			const month = computed({
				get() {
					if (!internalValue.value) return null;
					return internalValue.value.getMonth();
				},
				set(newMonth: number | null) {
					const newValue = internalValue.value ? new Date(internalValue.value) : new Date();
					newValue.setMonth(newMonth || 0);
					internalValue.value = newValue;
				},
			});

			const date = computed({
				get() {
					if (!internalValue.value) return null;
					return internalValue.value.getDate();
				},
				set(newDate: number | null) {
					const newValue = internalValue.value ? new Date(internalValue.value) : new Date();
					newValue.setDate(newDate || 1);
					internalValue.value = newValue;
				},
			});

			const hours = computed({
				get() {
					if (!internalValue.value) return null;
					const hours = internalValue.value.getHours();

					if (props.use24 === false) {
						return hours % 12;
					}

					return hours;
				},
				set(newHours: number | null) {
					const newValue = internalValue.value ? new Date(internalValue.value) : new Date();
					newValue.setHours(newHours || 0);
					internalValue.value = newValue;
				},
			});

			const minutes = computed({
				get() {
					if (!internalValue.value) return null;
					return internalValue.value.getMinutes();
				},
				set(newMinutes: number | null) {
					const newValue = internalValue.value ? new Date(internalValue.value) : new Date();
					newValue.setMinutes(newMinutes || 0);
					internalValue.value = newValue;
				},
			});

			const seconds = computed({
				get() {
					if (!internalValue.value) return null;
					return internalValue.value.getSeconds();
				},
				set(newSeconds: number | null) {
					const newValue = internalValue.value ? new Date(internalValue.value) : new Date();
					newValue.setSeconds(newSeconds || 0);
					internalValue.value = newValue;
				},
			});

			const period = computed({
				get() {
					if (!internalValue.value) return null;
					return internalValue.value.getHours() >= 12 ? 'pm' : 'am';
				},
				set(newAMPM: 'am' | 'pm' | null) {
					const newValue = internalValue.value ? new Date(internalValue.value) : new Date();
					const current = newValue.getHours() >= 12 ? 'pm' : 'am';

					if (current !== newAMPM) {
						if (newAMPM === 'am') {
							newValue.setHours(newValue.getHours() - 12);
						} else {
							newValue.setHours(newValue.getHours() + 12);
						}
					}

					internalValue.value = newValue;
				},
			});

			return { internalValue, year, month, date, hours, minutes, seconds, period };
		}

		function setToNow() {
			internalValue.value = props.includeSeconds ? new Date() : setSeconds(new Date(), 0);
		}

		function useDisplayValue() {
			const displayValue = ref<string | null>(null);

			watch(internalValue, setDisplayValue, { immediate: true });

			return { displayValue };

			async function setDisplayValue() {
				if (!props.value || !internalValue.value) {
					displayValue.value = null;
					return;
				}

				const timeFormat = props.includeSeconds ? 'date-fns_time' : 'date-fns_time_no_seconds';

				let format = `${t('date-fns_date')} ${t(timeFormat)}`;

				if (props.type === 'date') format = String(t('date-fns_date'));
				if (props.type === 'time') format = String(t(timeFormat));

				displayValue.value = await formatLocalized(internalValue.value, format);
			}
		}

		function useOptions() {
			const yearItems = computed(() => {
				const current = internalValue.value?.getFullYear() || new Date().getFullYear();
				const years = [];

				for (let i = current - 5; i <= current + 5; i++) {
					years.push({
						text: String(i),
						value: i,
					});
				}

				return years;
			});

			const monthItems = computed(() =>
				[
					t('months.january'),
					t('months.february'),
					t('months.march'),
					t('months.april'),
					t('months.may'),
					t('months.june'),
					t('months.july'),
					t('months.august'),
					t('months.september'),
					t('months.october'),
					t('months.november'),
					t('months.december'),
				].map((text, index) => ({
					text: text,
					value: index,
				}))
			);

			const dateItems = computed(() => {
				const dates = [];

				for (let i = 1; i <= 31; i++) {
					dates.push(`${i}`);
				}

				return dates;
			});

			const hourItems = computed(() => {
				const hours = [];

				const hoursInADay = props.use24 ? 24 : 12;

				for (let i = 0; i < hoursInADay; i++) {
					let hour = String(i);
					if (hour.length === 1) hour = '0' + hour;

					hours.push({
						text: hour,
						value: i,
					});
				}

				return hours;
			});

			const minutesSecondItems = computed(() => {
				const values = [];

				for (let i = 0; i < 60; i++) {
					let val = String(i);
					if (val.length === 1) val = '0' + val;
					values.push({
						text: val,
						value: i,
					});
				}

				return values;
			});

			return { yearItems, monthItems, dateItems, hourItems, minutesSecondItems };
		}
	},
});
</script>

<style lang="scss" scoped>
.date-selects,
.time-selects {
	display: grid;
	grid-gap: 8px;
	width: 100%;
	padding: 16px 8px;
}

.date-selects {
	grid-template-columns: repeat(2, 1fr);
}

.time-selects {
	grid-template-columns: repeat(3, 1fr);

	&.seconds {
		grid-template-columns: repeat(4, 1fr);
	}

	&.use-24 {
		grid-template-columns: repeat(2, 1fr);

		&.seconds {
			grid-template-columns: repeat(3, 1fr);
		}
	}
}

.month {
	grid-column: 1 / span 2;
}

.to-now {
	width: 100%;
	margin: 8px 0;
	color: var(--primary);
	text-align: center;
}

.v-icon.active {
	--v-icon-color: var(--primary);
}
</style>
