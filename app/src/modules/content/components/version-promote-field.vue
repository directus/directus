<script setup lang="ts">
import VTextOverflow from '@/components/v-text-overflow.vue';
import ValueNull from '@/views/private/components/value-null.vue';

defineProps<{ value?: string }>();
</script>

<template>
	<VTextOverflow v-if="value" :text="value" />
	<ValueNull v-else />
</template>
