<template>
	<sidebar-detail class="collections-filter" icon="filter_list" :title="t('collection', 2)">
		<div class="type-label label">{{ t('collections_shown') }}</div>
		<v-checkbox value="visible" v-model="internalValue" :label="t('visible_collections')" />
		<v-checkbox value="unmanaged" v-model="internalValue" :label="t('unmanaged_collections')" />
		<v-checkbox value="hidden" v-model="internalValue" :label="t('hidden_collections')" />
		<v-checkbox value="system" v-model="internalValue" :label="t('system_collections')" />
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, PropType } from 'vue';

export default defineComponent({
	emits: ['update:modelValue'],
	props: {
		modelValue: {
			type: Array as PropType<string[]>,
			required: true,
		},
	},
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
