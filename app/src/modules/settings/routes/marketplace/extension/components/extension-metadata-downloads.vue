<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ExtensionMetadataItem from './extension-metadata-item.vue';

defineProps<{ downloads: number }>();

const { t } = useI18n();
</script>

<template>
	<ExtensionMetadataItem icon="save_alt">{{ t('n_downloads', downloads) }}</ExtensionMetadataItem>
</template>
