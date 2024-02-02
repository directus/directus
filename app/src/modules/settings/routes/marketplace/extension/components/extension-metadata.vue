<script setup lang="ts">
import { RegistryDescribeResponse } from '@directus/extensions-registry';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ExtensionMetadataAuthor from './extension-metadata-author.vue';
import ExtensionMetadataCompatibility from './extension-metadata-compatibility.vue';
import ExtensionMetadataDate from './extension-metadata-date.vue';
import ExtensionMetadataDownloads from './extension-metadata-downloads.vue';
import ExtensionMetadataItem from './extension-metadata-item.vue';
import ExtensionMetadataSize from './extension-metadata-size.vue';
import ExtensionMetadataVersion from './extension-metadata-version.vue';

const props = defineProps<{
	extension: RegistryDescribeResponse;
}>();

const { t } = useI18n();

const latestVersion = computed(() => props.extension.versions.at(0)!);
</script>

<template>
	<v-list>
		<ExtensionMetadataAuthor
			:verified="latestVersion.publisher.verified"
			:username="latestVersion.publisher.username"
		/>
		<ExtensionMetadataCompatibility :host-version="latestVersion.host_version" />
		<ExtensionMetadataVersion :version="latestVersion.version" />
		<ExtensionMetadataDownloads :downloads="extension.downloads" />
		<ExtensionMetadataDate :publish-date="latestVersion.publish_date" />
		<ExtensionMetadataSize :unpacked-size="latestVersion.unpacked_size" :file-count="latestVersion.file_count" />
		<ExtensionMetadataItem v-if="latestVersion.url_homepage" icon="link" :href="latestVersion.url_homepage">{{ t('homepage') }}</ExtensionMetadataItem>
		<ExtensionMetadataItem v-if="latestVersion.url_repository" icon="commit" :href="latestVersion.url_repository">{{ t('repository') }}</ExtensionMetadataItem>
		<ExtensionMetadataItem v-if="latestVersion.url_bugs" icon="bug_report" :href="latestVersion.url_bugs">{{ t('report_an_issue') }}</ExtensionMetadataItem>
	</v-list>
</template>
