<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

defineProps<{ version: string }>();

const { t } = useI18n();
</script>

<template>
	<MetadataItem icon="sell" :title="t('Version')">v{{ version }}</MetadataItem>
</template>
