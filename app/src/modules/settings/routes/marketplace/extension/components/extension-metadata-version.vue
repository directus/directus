<script setup lang="ts">
import ExtensionMetadataMetric from './extension-metadata-metric.vue';

defineProps<{ version: string }>();
</script>

<template>
	<ExtensionMetadataMetric icon="info">v{{ version }}</ExtensionMetadataMetric>
</template>
