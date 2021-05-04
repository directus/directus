<template>
	<v-menu :close-on-content-click="false" attached :disabled="disabled">
		<template #activator="{ toggle, active }">
			<v-input
				:active="active"
				@click="toggle"
				readonly
				:value="displayValue"
				:disabled="disabled"
				:placeholder="$t('enter_a_value')"
			>
				<template #append>
					<v-icon v-if="!disabled" :name="value ? 'close' : 'today'" :class="{ active }" @click.stop="unsetValue" />
				</template>
			</v-input>
		</template>

		<div class="date-selects" v-if="type === 'timestamp' || type === 'dateTime' || type === 'date'">
			<div class="month">
				<v-select :placeholder="$t('month')" :items="monthItems" v-model="month" />
			</div>
			<div class="date">
				<v-select :placeholder="$t('date')" :items="dateItems" v-model="date" />
			</div>
			<div class="year">
				<v-select :placeholder="$t('year')" :items="yearItems" v-model="year" allow-other />
			</div>
		</div>

		<v-divider v-if="type === 'timestamp' || type === 'dateTime'" />

		<div
			class="time-selects"
			v-if="type === 'timestamp' || type === 'dateTime' || type === 'time'"
			:class="{ seconds: includeSeconds, 'use-24': use24 }"
		>
			<div class="hour">
				<v-select :items="hourItems" v-model="hours" />
			</div>
			<div class="minutes">
				<v-select :items="minutesSecondItems" v-model="minutes" />
			</div>
			<div v-if="includeSeconds" class="seconds">
				<v-select :items="minutesSecondItems" v-model="seconds" />
			</div>
			<div class="period" v-if="use24 === false">
				<v-select :items="['am', 'pm']" v-model="period" />
			</div>
		</div>

		<v-divider />

		<button class="to-now" @click="setToNow">{{ $t('interfaces.datetime.set_to_now') }}</button>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, PropType } from '@vue/composition-api';
import formatLocalized from '@/utils/localized-format';
import { i18n } from '@/lang';
import { formatISO, parseISO, format, parse } from 'date-fns';

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
	setup(props, { emit }) {
		const { _value, year, month, date, hours, minutes, seconds, period } = useLocalValue();
		const { yearItems, monthItems, dateItems, hourItems, minutesSecondItems } = useOptions();
		const { displayValue } = useDisplayValue();

		return {
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
			const _value = computed({
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
					if (!_value.value) return null;
					return _value.value.getFullYear();
				},
				set(newYear: number | null) {
					const newValue = _value.value ? new Date(_value.value) : new Date();
					newValue.setFullYear(newYear || 0);
					_value.value = newValue;
				},
			});

			const month = computed({
				get() {
					if (!_value.value) return null;
					return _value.value.getMonth();
				},
				set(newMonth: number | null) {
					const newValue = _value.value ? new Date(_value.value) : new Date(0);
					newValue.setMonth(newMonth || 0);
					_value.value = newValue;
				},
			});

			const date = computed({
				get() {
					if (!_value.value) return null;
					return _value.value.getDate();
				},
				set(newDate: number | null) {
					const newValue = _value.value ? new Date(_value.value) : new Date(0);
					newValue.setDate(newDate || 1);
					_value.value = newValue;
				},
			});

			const hours = computed({
				get() {
					if (!_value.value) return null;
					const hours = _value.value.getHours();

					if (props.use24 === false) {
						return hours % 12;
					}

					return hours;
				},
				set(newHours: number | null) {
					const newValue = _value.value ? new Date(_value.value) : new Date(0);
					newValue.setHours(newHours || 0);
					_value.value = newValue;
				},
			});

			const minutes = computed({
				get() {
					if (!_value.value) return null;
					return _value.value.getMinutes();
				},
				set(newMinutes: number | null) {
					const newValue = _value.value ? new Date(_value.value) : new Date(0);
					newValue.setMinutes(newMinutes || 0);
					_value.value = newValue;
				},
			});

			const seconds = computed({
				get() {
					if (!_value.value) return null;
					return _value.value.getSeconds();
				},
				set(newSeconds: number | null) {
					const newValue = _value.value ? new Date(_value.value) : new Date(0);
					newValue.setSeconds(newSeconds || 0);
					_value.value = newValue;
				},
			});

			const period = computed({
				get() {
					if (!_value.value) return null;
					return _value.value.getHours() >= 12 ? 'pm' : 'am';
				},
				set(newAMPM: 'am' | 'pm' | null) {
					const newValue = _value.value ? new Date(_value.value) : new Date();
					const current = newValue.getHours() >= 12 ? 'pm' : 'am';

					if (current !== newAMPM) {
						if (newAMPM === 'am') {
							newValue.setHours(newValue.getHours() - 12);
						} else {
							newValue.setHours(newValue.getHours() + 12);
						}
					}

					_value.value = newValue;
				},
			});

			return { _value, year, month, date, hours, minutes, seconds, period };
		}

		function setToNow() {
			_value.value = new Date();
		}

		function useDisplayValue() {
			const displayValue = ref<string | null>(null);

			watch(_value, setDisplayValue, { immediate: true });

			return { displayValue };

			async function setDisplayValue() {
				if (!props.value || !_value.value) {
					displayValue.value = null;
					return;
				}

				const timeFormat = props.includeSeconds ? 'date-fns_time' : 'date-fns_time_no_seconds';

				let format = `${i18n.t('date-fns_date')} ${i18n.t(timeFormat)}`;

				if (props.type === 'date') format = String(i18n.t('date-fns_date'));
				if (props.type === 'time') format = String(i18n.t(timeFormat));

				displayValue.value = await formatLocalized(_value.value, format);
			}
		}

		function useOptions() {
			const yearItems = computed(() => {
				const current = _value.value?.getFullYear() || new Date().getFullYear();
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
					i18n.t('months.january'),
					i18n.t('months.february'),
					i18n.t('months.march'),
					i18n.t('months.april'),
					i18n.t('months.may'),
					i18n.t('months.june'),
					i18n.t('months.july'),
					i18n.t('months.august'),
					i18n.t('months.september'),
					i18n.t('months.october'),
					i18n.t('months.november'),
					i18n.t('months.december'),
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
