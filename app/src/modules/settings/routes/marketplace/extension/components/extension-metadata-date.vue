<script setup lang="ts">
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import { useI18n } from 'vue-i18n';
import ExtensionMetadataMetric from './extension-metadata-metric.vue';

defineProps<{ publishDate: string }>();

const { t } = useI18n();
</script>

<template>
	<ExtensionMetadataMetric icon="event">
		{{
			t('last_updated_relative', {
				relativeTime: localizedFormatDistanceStrict(new Date(publishDate), new Date(), {
					addSuffix: true,
				}),
			})
		}}
	</ExtensionMetadataMetric>
</template>
