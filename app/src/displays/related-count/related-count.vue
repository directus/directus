<template>
	<FormattedValue class="display-related-count" :value="count" type="number" v-bind="$attrs" />
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from 'lodash';
import FormattedValue from '../formatted-value/formatted-value.vue';

export default defineComponent({
	props: {
		field: {
			type: String,
			required: true,
		},
		rootItem: {
			type: Object as PropType<Record<string, any>>,
			required: true,
		},
	},
	setup(props) {
		const { t, n } = useI18n();
		const count = computed(() => get(props.rootItem, `${props.field}_count`) ?? 0);

		return { t, count };
	},
	components: { FormattedValue },
});
</script>
