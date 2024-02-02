<script setup lang="ts">
import ExtensionMetadataItem from './extension-metadata-item.vue';

defineProps<{ version: string }>();
</script>

<template>
	<ExtensionMetadataItem icon="info">v{{ version }}</ExtensionMetadataItem>
</template>
