<template>
	<sidebar-detail :badge="filters.length > 0 ? filters.length : null" icon="filter_list" :title="t('advanced_filter')">
		<advanced-filter v-model="filters" :collection="collection" :loading="loading" />
	</sidebar-detail>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { Filter } from '@directus/shared/types';
import AdvancedFilter from '../advanced-filter';

export default defineComponent({
	components: { AdvancedFilter },
	props: {
		modelValue: {
			type: Array as PropType<Filter[]>,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const filters = computed({
			get() {
				return props.modelValue || [];
			},
			set(newVal: string[]) {
				emit('update:modelValue', newVal);
			},
		});
		return { filters, t };
	},
});
</script>
