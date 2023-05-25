<template>
	<v-menu ref="dateTimeMenu" :close-on-content-click="false" attached :disabled="disabled" full-height seamless>
		<template #activator="{ toggle, active }">
			<v-input
				:active="active"
				clickable
				readonly
				:model-value="displayValue"
				:disabled="disabled"
				:placeholder="!isValidValue ? value : t('enter_a_value')"
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
			@update:model-value="$emit('input', $event)"
			@close="dateTimeMenu?.deactivate"
		/>
	</v-menu>
</template>

<script setup lang="ts">
import { localizedFormat } from '@/utils/localized-format';
import { isValid, parse, parseISO } from 'date-fns';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		value: string | null;
		type: 'timestamp' | 'dateTime' | 'time' | 'date';
		disabled?: boolean;
		includeSeconds?: boolean;
		use24?: boolean;
	}>(),
	{
		use24: true,
	}
);

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

const dateTimeMenu = ref();

const { displayValue, isValidValue } = useDisplayValue();

function useDisplayValue() {
	const displayValue = ref<string | null>(null);

	const isValidValue = computed(() => isValid(parseValue(props.value!)));

	watch(() => props.value, setDisplayValue, { immediate: true });

	return { displayValue, isValidValue };

	function setDisplayValue() {
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
</script>

<style lang="scss" scoped>
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
