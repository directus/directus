<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{ downloads: number }>();

const { t } = useI18n();
</script>

<template>
	<ExtensionMetadataMetric icon="save_alt">{{ t('n_downloads', downloads) }}</ExtensionMetadataMetric>
</template>
