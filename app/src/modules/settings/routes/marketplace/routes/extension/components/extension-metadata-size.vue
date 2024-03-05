<script setup lang="ts">
import { formatFilesize } from '@/utils/format-filesize';
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

defineProps<{ fileCount: number; unpackedSize: number }>();

const { t } = useI18n();
</script>

<template>
	<MetadataItem icon="folder_open" :title="t('Size')">
		{{ formatFilesize(unpackedSize) }} ({{ t('n_files', fileCount) }})
	</MetadataItem>
</template>
