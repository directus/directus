<template>
	<span>{{ displayValue }}</span>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import formatLocalized from '@/utils/localized-format';
import i18n from '@/lang';
import parse from 'date-fns/parse';

export default defineComponent({
	props: {
		value: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const displayValue = ref<string>(null);

		watch(
			() => props.value,
			async (newValue) => {
				if (newValue === null) {
					displayValue.value = null;
					return;
				}

				let format = `${i18n.t('date-fns_date')} ${i18n.t('date-fns_time')}`;

				if (props.type === 'date') format = String(i18n.t('date-fns_date'));
				if (props.type === 'time') format = String(i18n.t('date-fns_time'));

				displayValue.value = await formatLocalized(
					parse(props.value, 'yyyy-MM-dd HH:mm:ss', new Date()),
					format
				);
			}
		);

		return { displayValue };
	},
});
</script>
