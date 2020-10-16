<template>
	<sidebar-detail class="collections-filter" icon="filter_list" :title="$tc('collection', 2)">
		<div class="type-label label">{{ $t('collections_shown') }}</div>
		<v-checkbox value="visible" v-model="_value" :label="$t('visible_collections')" />
		<v-checkbox value="unmanaged" v-model="_value" :label="$t('unmanaged_collections')" />
		<v-checkbox value="hidden" v-model="_value" :label="$t('hidden_collections')" />
		<v-checkbox value="system" v-model="_value" :label="$t('system_collections')" />
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: Array as PropType<string[]>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _value = computed({
			get() {
				return props.value;
			},
			set(newVal) {
				emit('input', newVal);
			},
		});

		return { _value };
	},
});
</script>

<style lang="scss" scoped>
.label {
	margin-bottom: 8px;
}
</style>
