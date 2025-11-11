<script setup lang="ts">
import MetadataItem from '../../../components/metadata-item.vue';
import { useI18n } from 'vue-i18n';

defineProps<{ downloads: number }>();

const { t, n } = useI18n();
</script>

<template>
	<MetadataItem icon="save_alt">{{ $t('n_downloads', { n: n(downloads) }) }}</MetadataItem>
</template>
