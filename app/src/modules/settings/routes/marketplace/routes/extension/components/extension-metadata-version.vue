<script setup lang="ts">
import MetadataItem from '../../../components/metadata-item.vue';

defineProps<{ version: string }>();
</script>

<template>
	<MetadataItem icon="info">v{{ version }}</MetadataItem>
</template>
