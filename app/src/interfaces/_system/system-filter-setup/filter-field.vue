<template>
	<div class="filter-field">
		<div class="operator">
			<v-select v-model="operator" :items="operators" inline :placeholder="t('select')" />
		</div>

		<div class="filter-input">
			<v-input v-model="filterValue" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Field, FieldFilterOperator } from '@directus/shared/types';
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
		value: {
			type: Object as PropType<FieldFilterOperator>,
			default: () => ({}),
		},
	},
	emits: ['update:value'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const operators = computed(() =>
			getFilterOperatorsForType(props.field.type).map((operator) => ({
				text: t(`operators.${operator}`),
				value: `_${operator}`,
			}))
		);

		const filterValue = computed({
			get() {
				return Object.values(props.value || {})[0];
			},
			set(newValue: string | number | boolean | (string | number)[]) {
				emit('update:value', {
					[Object.keys(props.value || {})[0]]: newValue,
				});
			},
		});

		const operator = computed({
			get() {
				return (Object.keys(props.value)[0] as keyof FieldFilterOperator) ?? '_eq';
			},
			set(operator: keyof FieldFilterOperator) {
				emit('update:value', {
					[operator]: null,
				});
			},
		});

		return { operators, operator, t, filterValue };
	},
});
</script>

<style scoped>
.filter-field {
	padding-left: 12px;
	border-left: 2px solid var(--border-subdued);
	display: flex;
}

.operator {
	margin-right: 8px;
}
</style>
