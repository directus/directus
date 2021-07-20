<template><v-select :items="operators"</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Field } from '@directus/shared/types';
import { computed } from '@vue/runtime-core';
import { getFilterOperatorsForType } from '@directus/shared/utils';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	name: 'filter-field',
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const operators = computed(() =>
			getFilterOperatorsForType(props.field.type).map((operator) => ({
				text: t(operator.label),
				value: operator,
			}))
		);

		return { operators };
	},
});
</script>
