<script setup lang="ts">
withDefaults(
	defineProps<{
		value: string | null;
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
