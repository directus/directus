<script setup lang="ts">
import { RegistryDescribeResponse } from '@directus/extensions-registry';
import ExtensionMetadataMetric from './extension-metadata-metric.vue';

defineProps<{
	extension: RegistryDescribeResponse;
}>();
</script>

<template>
	<v-list>
		<ExtensionMetadataMetric icon="info">v1.0.32</ExtensionMetadataMetric>
	</v-list>
</template>
