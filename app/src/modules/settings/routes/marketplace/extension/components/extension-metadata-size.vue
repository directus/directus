<script setup lang="ts">
import { formatFilesize } from '@/utils/format-filesize';
import { useI18n } from 'vue-i18n';
import ExtensionMetadataMetric from './extension-metadata-metric.vue';

const { t } = useI18n();

defineProps<{ fileCount: number; unpackedSize: number }>();
</script>

<template>
	<ExtensionMetadataMetric icon="folder_open">
		{{ formatFilesize(unpackedSize) }} ({{ t('n_files', fileCount) }})
	</ExtensionMetadataMetric>
</template>
