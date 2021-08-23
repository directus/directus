<template>
	<sidebar-detail class="collections-filter" icon="filter_list" :title="t('collection', 2)">
		<div class="type-label label">{{ t('collections_shown') }}</div>
		<v-checkbox v-model="internalValue" value="visible" :label="t('visible_collections')" />
		<v-checkbox v-model="internalValue" value="unmanaged" :label="t('unmanaged_collections')" />
		<v-checkbox v-model="internalValue" value="hidden" :label="t('hidden_collections')" />
		<v-checkbox v-model="internalValue" value="system" :label="t('system_collections')" />
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, PropType } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: Array as PropType<string[]>,
			required: true,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const internalValue = computed({
			get() {
				return props.modelValue;
			},
			set(newVal) {
				emit('update:modelValue', newVal);
			},
		});

		return { t, internalValue };
	},
});
</script>

<style lang="scss" scoped>
.label {
	margin-bottom: 8px;
}
</style>
