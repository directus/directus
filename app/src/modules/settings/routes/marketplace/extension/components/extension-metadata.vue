<script setup lang="ts">
import { computed } from 'vue';
import { RegistryDescribeResponse } from '@directus/extensions-registry';
import ExtensionMetadataMetric from './extension-metadata-metric.vue';
import ExtensionMetadataCompatibility from './extension-metadata-compatibility.vue';

const props =defineProps<{
	extension: RegistryDescribeResponse;
}>();

const latestVersion = computed(() => props.extension.versions.at(0)!);
</script>

<template>
	<v-list>
		<ExtensionMetadataCompatibility :host-version="latestVersion.host_version"/>
		<ExtensionMetadataMetric icon="info">v{{ latestVersion.version }}</ExtensionMetadataMetric>
	</v-list>
</template>
