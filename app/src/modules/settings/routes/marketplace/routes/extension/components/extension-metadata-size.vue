<script setup lang="ts">
import { formatFilesize } from '@/utils/format-filesize';
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

const { t } = useI18n();

defineProps<{ fileCount: number; unpackedSize: number }>();
</script>

<template>
	<MetadataItem icon="folder_open">{{ formatFilesize(unpackedSize) }} ({{ t('n_files', fileCount) }})</MetadataItem>
</template>
