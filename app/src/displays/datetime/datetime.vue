<template>
	<span class="datetime">{{ displayValue }}</span>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from '@vue/composition-api';
import localizedFormat from '@/utils/localized-format';
import localizedFormatDistance from '@/utils/localized-format-distance';
import i18n from '@/lang';
import parseISO from 'date-fns/parseISO';

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
		relative: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const displayValue = ref<string | null>(null);

		watch(
			() => props.value,
			async (newValue) => {
				if (newValue === null) {
					displayValue.value = null;
					return;
				}

				const date = parseISO(props.value);

				if (props.relative) {
					displayValue.value = await localizedFormatDistance(date, new Date(), {
						addSuffix: true,
					});
				} else {
					let format = `${i18n.t('date-fns_date')} ${i18n.t('date-fns_time')}`;
					if (props.type === 'date') format = String(i18n.t('date-fns_date'));
					if (props.type === 'time') format = String(i18n.t('date-fns_time'));

					displayValue.value = await localizedFormat(date, format);
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
}
</style>
