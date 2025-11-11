<script setup lang="ts">
import { formatFilesize } from '@/utils/format-filesize';
import MetadataItem from '../../../components/metadata-item.vue';


defineProps<{ fileCount: number; unpackedSize: number }>();
</script>

<template>
	<MetadataItem icon="folder_open">{{ formatFilesize(unpackedSize) }} ({{ $t('n_files', fileCount) }})</MetadataItem>
</template>
