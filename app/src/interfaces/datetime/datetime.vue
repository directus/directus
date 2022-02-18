<template>
	<v-menu ref="dateTimeMenu" :close-on-content-click="false" attached :disabled="disabled" full-height seamless>
		<template #activator="{ toggle, active }">
			<v-input :active="active" clickable readonly :model-value="displayValue" :disabled="disabled" @click="toggle">
				<template v-if="!disabled" #append>
					<v-icon :name="value ? 'close' : 'today'" :class="{ active }" @click.stop="unsetValue" />
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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, ref, watch } from 'vue';
import formatLocalized from '@/utils/localized-format';
import { parse, parseISO } from 'date-fns';

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

		const dateTimeMenu = ref();

		const { displayValue } = useDisplayValue();

		function useDisplayValue() {
			const displayValue = ref<string | null>(null);

			watch(() => props.value, setDisplayValue, { immediate: true });

			return { displayValue };

			async function setDisplayValue() {
				if (!props.value) {
					displayValue.value = null;
					return;
				}
				const timeFormat = props.includeSeconds ? 'date-fns_time' : 'date-fns_time_no_seconds';
				let format = `${t('date-fns_date')} ${t(timeFormat)}`;
				if (props.type === 'date') format = String(t('date-fns_date'));
				if (props.type === 'time') format = String(t(timeFormat));

				displayValue.value = await formatLocalized(parseValue(props.value), format);
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

		function unsetValue() {
			emit('input', null);
		}

		return { displayValue, unsetValue, dateTimeMenu };
	},
});
</script>

<style lang="scss" scoped>
.v-icon.active {
	--v-icon-color: var(--primary);
}
</style>
