<template>
	<span class="datetime">{{ displayValue }}</span>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType, computed } from '@vue/composition-api';
import localizedFormat from '@/utils/localized-format';
import localizedFormatDistance from '@/utils/localized-format-distance';
import i18n from '@/lang';
import { parseISO, parse } from 'date-fns';

export default defineComponent({
	props: {
		value: {
			type: String,
			required: true,
		},
		type: {
			type: String as PropType<'dateTime' | 'time' | 'date' | 'timestamp'>,
			required: true,
			validator: (val: string) => ['dateTime', 'date', 'time', 'timestamp'].includes(val),
		},
		format: {
			type: String,
			default: 'long',
		},
		relative: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const localValue = computed(() => {
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
		});

		const displayValue = ref<string | null>(null);

		watch(
			localValue,
			async (newValue) => {
				if (newValue === null) {
					displayValue.value = null;
					return;
				}

				if (props.relative) {
					displayValue.value = await localizedFormatDistance(newValue, new Date(), {
						addSuffix: true,
					});
				} else {
					let format;
					if (props.format === 'long') {
						format = `${i18n.t('date-fns_date')} ${i18n.t('date-fns_time')}`;
						if (props.type === 'date') format = String(i18n.t('date-fns_date'));
						if (props.type === 'time') format = String(i18n.t('date-fns_time'));
					} else if (props.format === 'short') {
						format = `${i18n.t('date-fns_date_short')} ${i18n.t('date-fns_time_short')}`;
						if (props.type === 'date') format = String(i18n.t('date-fns_date_short'));
						if (props.type === 'time') format = String(i18n.t('date-fns_time_short'));
					} else {
						format = props.format;
					}

					displayValue.value = await localizedFormat(newValue, format);
				}
			},
			{ immediate: true }
		);

		return { displayValue };
	},
});
</script>

<style lang="scss" scoped>
.datetime {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	line-height: 1.15;
}
</style>
