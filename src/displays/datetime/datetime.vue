<template>
	<span class="datetime">{{ displayValue }}</span>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from '@vue/composition-api';
import formatLocalized from '@/utils/localized-format';
import i18n from '@/lang';
import parse from 'date-fns/parse';
import parseISO from 'date-fns/parseISO';

export default defineComponent({
	props: {
		value: {
			type: String,
			required: true,
		},
		type: {
			type: String as PropType<'datetime' | 'time' | 'date'>,
			required: true,
			validator: (val: string) => ['datetime', 'date', 'time'].includes(val),
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

				let date: Date;

				if (newValue.includes('T')) {
					date = parseISO(props.value);
				} else {
					date = parse(props.value, 'yyyy-MM-dd HH:mm:ss', new Date());
				}

				let format = `${i18n.t('date-fns_date')} ${i18n.t('date-fns_time')}`;
				if (props.type === 'date') format = String(i18n.t('date-fns_date'));
				if (props.type === 'time') format = String(i18n.t('date-fns_time'));

				displayValue.value = await formatLocalized(date, format);
			}
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
