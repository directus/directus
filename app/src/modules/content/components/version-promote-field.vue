<script setup lang="ts">
import ValueNull from '@/views/private/components/value-null.vue';

defineProps<{ value?: string }>();
</script>

<template>
	<v-text-overflow v-if="value" :text="value" />
	<value-null v-else />
</template>
