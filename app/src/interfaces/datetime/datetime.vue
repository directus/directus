<script setup lang="ts">
import { isValid } from 'date-fns';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { parseDate } from '@/utils/parse-date';
import { formatDate } from '@/utils/format-date';

const props = withDefaults(
	defineProps<{
		value: string | null;
		type: 'timestamp' | 'dateTime' | 'time' | 'date';
		disabled?: boolean;
		includeSeconds?: boolean;
		use24?: boolean;
		relative?: boolean;
		suffix?: boolean;
		strict?: boolean;
		round?: 'round' | 'floor' | 'ceil';
		format?: 'short' | 'long';
	}>(),
	{
		use24: true,
		format: 'long',
		relative: false,
		strict: false,
		round: 'round',
		suffix: true,
	},
);

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

const dateTimeMenu = ref();

const { displayValue, isValidValue } = useDisplayValue();

function useDisplayValue() {
	const displayValue = ref<string | null>(null);

	const isValidValue = computed(() => (props.value ? isValid(parseDate(props.value, props.type)) : false));

	watch(() => props.value, setDisplayValue, { immediate: true });

	return { displayValue, isValidValue };

	function setDisplayValue() {
		if (!props.value || !isValidValue.value) {
			displayValue.value = null;
			return;
		}

		displayValue.value = formatDate(props.value, {
			...props,
		});
	}
}

function unsetValue(e: any) {
	e.preventDefault();
	e.stopPropagation();
	emit('input', null);
}
</script>

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

<style lang="scss" scoped>
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
}
</style>
