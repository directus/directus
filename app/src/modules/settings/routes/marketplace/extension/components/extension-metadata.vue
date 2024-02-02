<script setup lang="ts">
import { computed } from 'vue';
import { RegistryDescribeResponse } from '@directus/extensions-registry';
import ExtensionMetadataMetric from './extension-metadata-metric.vue';
import ExtensionMetadataCompatibility from './extension-metadata-compatibility.vue';
import { useI18n } from 'vue-i18n';
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';

const props = defineProps<{
	extension: RegistryDescribeResponse;
}>();

const { t } = useI18n();

const latestVersion = computed(() => props.extension.versions.at(0)!);
</script>

<template>
	<v-list>
		<ExtensionMetadataCompatibility :host-version="latestVersion.host_version" />
		<ExtensionMetadataMetric icon="info">v{{ latestVersion.version }}</ExtensionMetadataMetric>
		<ExtensionMetadataMetric icon="save_alt">{{ t('n_downloads', extension.downloads) }}</ExtensionMetadataMetric>
		<ExtensionMetadataMetric icon="event">
			{{
				t('last_updated_relative', {
					relativeTime: localizedFormatDistanceStrict(new Date(latestVersion.publish_date), new Date(), {
						addSuffix: true,
					}),
				})
			}}
		</ExtensionMetadataMetric>
	</v-list>
</template>
