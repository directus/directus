<template>
	<span class="datetime">{{ displayValue }}</span>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from '@vue/composition-api';
import { localizedFormat } from '@/utils';
import i18n from '@/lang';
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
			validator: (val: string) => ['datetime', 'date', 'time', 'timestamp'].includes(val),
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

				let format = `${i18n.t('date-fns_date')} ${i18n.t('date-fns_time')}`;
				if (props.type === 'date') format = String(i18n.t('date-fns_date'));
				if (props.type === 'time') format = String(i18n.t('date-fns_time'));

				displayValue.value = await localizedFormat(date, format);
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
