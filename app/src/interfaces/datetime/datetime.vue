<template>
	<v-menu ref="dateTimeMenu" :close-on-content-click="false" attached :disabled="disabled" full-height seamless>
		<template #activator="{ toggle, active }">
			<v-input
				:active="active"
				:class="{ invalid }"
				:disabled="disabled"
				:model-value="displayValue"
				:placeholder="!isValidValue ? value : t('enter_a_value')"
				clickable
				readonly
				@click="toggle"
			>
				<template v-if="!disabled" #append>
					<v-icon
						:name="value ? 'clear' : 'today'"
						:class="{ active, 'clear-icon': value, 'today-icon': !value }"
						v-on="{ click: value ? unsetValue : null }"
					/>
				</template>
			</v-input>
		</template>

		<v-date-picker
			:type="type"
			:disabled="disabled"
			:include-seconds="includeSeconds"
			:use-24="use24"
			:model-value="value"
			:min="min"
			:max="max"
			@update:model-value="$emit('input', $event)"
			@close="dateTimeMenu?.deactivate"
		/>
	</v-menu>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { ComputedRef, computed, defineComponent, inject, PropType, ref, watch } from 'vue';
import { localizedFormat } from '@/utils/localized-format';
import { isValid, parse, parseISO } from 'date-fns';
import { get } from 'lodash';

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
		minField: {
			type: String,
			default: '',
		},
		maxField: {
			type: String,
			default: '',
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const dateTimeMenu = ref();

		const { displayValue, isValidValue } = useDisplayValue();

		const values = inject('values') as ComputedRef<Record<string, any>>;

		const min = computed(() => (props.minField ? get(values.value, props.minField) : ''));
		const max = computed(() => (props.maxField ? get(values.value, props.maxField) : ''));

		const invalid = computed(() => {
			if (!props.value) {
				return false;
			}
			if (min.value && props.value < min.value) {
				return true;
			}
			if (max.value && props.value > max.value) {
				return true;
			}
			return false;
		});

		function useDisplayValue() {
			const displayValue = ref<string | null>(null);

			const isValidValue = computed(() => isValid(parseValue(props.value)));

			watch(() => props.value, setDisplayValue, { immediate: true });

			return { displayValue, isValidValue };

			async function setDisplayValue() {
				if (!props.value || !isValidValue.value) {
					displayValue.value = null;
					return;
				}
				let timeFormat = props.includeSeconds ? 'date-fns_time' : 'date-fns_time_no_seconds';
				if (props.use24) timeFormat = props.includeSeconds ? 'date-fns_time_24hour' : 'date-fns_time_no_seconds_24hour';
				let format = `${t('date-fns_date')} ${t(timeFormat)}`;
				if (props.type === 'date') format = String(t('date-fns_date'));
				if (props.type === 'time') format = String(t(timeFormat));

				displayValue.value = localizedFormat(parseValue(props.value), format);
			}

			function parseValue(value: string): Date {
				switch (props.type) {
					case 'dateTime':
						return parse(value, "yyyy-MM-dd'T'HH:mm:ss", new Date());
					case 'date':
						return parse(value, 'yyyy-MM-dd', new Date());
					case 'time':
						return parse(value, 'HH:mm:ss', new Date());
					case 'timestamp':
						return parseISO(value);
				}
			}
		}

		function unsetValue(e: any) {
			e.preventDefault();
			e.stopPropagation();
			emit('input', null);
		}

		return { t, displayValue, unsetValue, dateTimeMenu, isValidValue, min, max, invalid };
	},
});
</script>

<style lang="scss" scoped>
.v-input.invalid {
	--border-normal: var(--danger);
}
.v-icon {
	&.today-icon {
		&:hover,
		&.active {
			--v-icon-color: var(--primary);
		}
	}

	&.clear-icon {
		&:hover,
		&.active {
			--v-icon-color: var(--danger);
		}
	}
}
</style>
