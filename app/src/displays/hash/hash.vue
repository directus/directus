<script setup lang="ts">
import ValueNull from '@/views/private/components/value-null.vue';

withDefaults(
	defineProps<{
		value?: string | null;
	}>(),
	{
		value: null,
	},
);
</script>

<template>
	<value-null v-if="value === null" />

	<div v-else>**********</div>
</template>
