<template>
	<v-menu attached :disabled="disabled" :overflow-scroll="false">
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
					<v-icon name="today" :class="{ active }" />
				</template>
			</v-input>
		</template>

		<div class="date" v-if="type === 'datetime' || type === 'date'">
			<div class="month">
				<v-select :placeholder="$t('month')" :items="months" v-model="localValue.month" />
			</div>
			<div class="day">
				<v-select :placeholder="$t('date')" :items="days" v-model="localValue.day" />
			</div>
			<div class="year">
				<v-select
					:placeholder="$t('year')"
					:items="years"
					v-model="localValue.year"
					allow-other
				/>
			</div>
		</div>

		<v-divider v-if="type === 'datetime'" />

		<div class="time" v-if="type === 'datetime' || type === 'time'">
			<div class="hour">
				<v-select :items="hours" v-model="localValue.hours" />
			</div>
			<div class="minutes">
				<v-select :items="minutesSeconds" v-model="localValue.minutes" />
			</div>
			<div class="seconds">
				<v-select :items="minutesSeconds" v-model="localValue.seconds" />
			</div>
		</div>

		<v-divider />

		<button class="to-now" @click="setToNow">{{ $t('set_to_now') }}</button>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, reactive, PropType } from '@vue/composition-api';
import formatLocalized from '@/utils/localized-format';
import { i18n } from '@/lang';
import parse from 'date-fns/parse';
import format from 'date-fns/format';

type LocalValue = {
	month: null | number;
	day: null | number;
	year: null | number;
	hours: null | number;
	minutes: null | number;
	seconds: null | number;
};

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
			type: String as PropType<'datetime' | 'time' | 'date'>,
			required: true,
			validator: (val: string) => ['datetime', 'date', 'time'].includes(val),
		},
	},
	setup(props, { emit }) {
		const formatString = computed(() => {
			const date = 'yyyy-MM-dd';
			const time = 'HH:mm:ss';

			if (props.type === 'datetime') {
				return date + ' ' + time;
			}

			if (props.type === 'date') {
				return date;
			}

			return time;
		});

		const valueAsDate = computed(() =>
			props.value ? parse(props.value, formatString.value, new Date()) : null
		);

		const displayValue = ref<string>(null);

		syncDisplayValue();

		const localValue = reactive({
			month: null,
			day: null,
			year: null,
			hours: 9,
			minutes: 0,
			seconds: 0,
		} as LocalValue);

		syncLocalValue();

		watch(
			() => props.value,
			(newValue, oldValue) => {
				if (newValue !== oldValue && newValue !== null && newValue.length !== 0) {
					syncLocalValue();
					syncDisplayValue();
				}
			}
		);

		watch(
			() => localValue,
			(newValue) => {
				if (
					newValue.year !== null &&
					String(newValue.year).length === 4 &&
					newValue.month !== null &&
					newValue.day !== null &&
					newValue.hours !== null &&
					newValue.minutes !== null &&
					newValue.seconds !== null
				) {
					const { year, month, day, hours, minutes, seconds } = newValue;
					const date = new Date(year, month, day, hours, minutes, seconds);
					emit('input', format(date, formatString.value));
				}
			},
			{
				deep: true,
			}
		);

		const { months, days, years, hours, minutesSeconds } = useOptions();

		return {
			displayValue,
			months,
			days,
			years,
			hours,
			minutesSeconds,
			setToNow,
			localValue,
		};

		function setToNow() {
			const date = new Date();

			localValue.month = date.getMonth();
			localValue.day = date.getDate();
			localValue.year = date.getFullYear();
			localValue.hours = date.getHours();
			localValue.minutes = date.getMinutes();
			localValue.seconds = date.getSeconds();
		}

		function syncLocalValue() {
			if (!valueAsDate.value) return;
			localValue.month = valueAsDate.value.getMonth();
			localValue.day = valueAsDate.value.getDate();
			localValue.year = valueAsDate.value?.getFullYear();
			localValue.hours = valueAsDate.value?.getHours();
			localValue.minutes = valueAsDate.value?.getMinutes();
			localValue.seconds = valueAsDate.value?.getSeconds();
		}

		async function syncDisplayValue() {
			if (valueAsDate.value === null) return null;
			let format = `${i18n.t('date-fns_date')} ${i18n.t('date-fns_time')}`;

			if (props.type === 'date') format = String(i18n.t('date-fns_date'));
			if (props.type === 'time') format = String(i18n.t('date-fns_time'));

			displayValue.value = await formatLocalized(valueAsDate.value as Date, format);
		}

		function useOptions() {
			const months = computed(() =>
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

			const days = computed(() => {
				const days = [];

				for (let i = 1; i <= 31; i++) {
					days.push(`${i}`);
				}

				return days;
			});

			const years = computed(() => {
				const current = valueAsDate.value?.getFullYear() || new Date().getFullYear();
				const years = [];
				for (let i = current - 5; i <= current + 5; i++) {
					years.push({
						text: String(i),
						value: i,
					});
				}
				return years;
			});

			const hours = computed(() => {
				const hours = [];

				for (let i = 0; i <= 24; i++) {
					let hour = String(i);
					if (hour.length === 1) hour = '0' + hour;
					hours.push({
						text: hour,
						value: i,
					});
				}

				return hours;
			});

			const minutesSeconds = computed(() => {
				const values = [];

				for (let i = 0; i <= 60; i++) {
					let val = String(i);
					if (val.length === 1) val = '0' + val;
					values.push({
						text: val,
						value: i,
					});
				}

				return values;
			});

			return { days, years, months, hours, minutesSeconds };
		}
	},
});
</script>

<style lang="scss" scoped>
.date,
.time {
	display: grid;
	grid-gap: 8px;
	width: 100%;
	padding: 16px 8px;
}

.date {
	grid-template-columns: repeat(2, 1fr);
}

.time {
	grid-template-columns: repeat(3, 1fr);
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
