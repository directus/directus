<script setup lang="ts">
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import { useI18n } from 'vue-i18n';
import ExtensionMetadataItem from './extension-metadata-item.vue';

defineProps<{ publishDate: string }>();

const { t } = useI18n();
</script>

<template>
	<ExtensionMetadataItem icon="event">
		{{
			t('last_updated_relative', {
				relativeTime: localizedFormatDistanceStrict(new Date(publishDate), new Date(), {
					addSuffix: true,
				}),
			})
		}}
	</ExtensionMetadataItem>
</template>
