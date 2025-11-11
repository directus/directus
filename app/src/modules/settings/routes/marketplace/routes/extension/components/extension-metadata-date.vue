<script setup lang="ts">
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

defineProps<{ publishDate: string }>();

const { t, d } = useI18n();
</script>

<template>
	<MetadataItem v-tooltip="d(publishDate, 'long')" has-tooltip icon="event">
		{{
			$t('last_updated_relative', {
				relativeTime: localizedFormatDistanceStrict(new Date(publishDate), new Date(), {
					addSuffix: true,
				}),
			})
		}}
	</MetadataItem>
</template>
