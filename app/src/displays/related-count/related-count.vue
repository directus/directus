<template>
	<value-null v-if="!value && !showZero" />
	<span v-else>{{ value }} {{ suffix }}</span>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import ValueNull from '@/views/private/components/value-null';
import { get } from 'lodash';

export default defineComponent({
	components: { ValueNull },
	props: {
		field: String,
		rootItem: Object as PropType<Record<string, any>>,
		showZero: Boolean,
		suffix: String,
	},
	setup(props) {
		const value = computed(() => get(props.rootItem, `${props.field}_count`));
		return {
			value,
		};
	},
});
</script>
