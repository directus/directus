<template>
	<value-null v-if="value === null || !info" />
	<div v-else>
		<v-icon v-if="icon" :name="info.icon" left small />
		{{ info.name }}
	</div>
</template>

<script lang="ts" setup>
import { toRefs } from 'vue';
import { useCollection } from '@directus/composables';

const props = withDefaults(
	defineProps<{
		value?: string | null;
		icon?: boolean;
	}>(),
	{
		value: null,
		icon: false,
	}
);

const { value: collection } = toRefs(props);
const { info } = useCollection(collection);
</script>
