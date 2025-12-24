<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import ValueNull from '@/views/private/components/value-null.vue';
import { useCollection } from '@directus/composables';
import { toRefs } from 'vue';

const props = withDefaults(
	defineProps<{
		value?: string | null;
		icon?: boolean;
	}>(),
	{
		value: null,
		icon: false,
	},
);

const collection = toRefs(props).value;
const { info } = useCollection(collection);
</script>

<template>
	<ValueNull v-if="value === null || !info" />
	<div v-else>
		<VIcon v-if="icon" :name="info.icon" left small />
		{{ info.name }}
	</div>
</template>
