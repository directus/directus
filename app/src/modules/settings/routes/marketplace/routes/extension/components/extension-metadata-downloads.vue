<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

defineProps<{ downloads: number }>();

const { t } = useI18n();
</script>

<template>
	<MetadataItem icon="save_alt">{{ t('n_downloads', downloads) }}</MetadataItem>
</template>
