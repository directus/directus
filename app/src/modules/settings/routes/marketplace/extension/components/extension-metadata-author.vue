<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ExtensionMetadataMetric from './extension-metadata-metric.vue';

const { t } = useI18n();

defineProps<{ username: string }>();
</script>

<template>
	<ExtensionMetadataMetric icon="face">{{ username }}</ExtensionMetadataMetric>
</template>
