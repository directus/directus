<script setup lang="ts">
import { RegistryDescribeResponse } from '@directus/extensions-registry';
import { computed } from 'vue';
import ExtensionMetadataAuthor from './extension-metadata-author.vue';
import ExtensionMetadataCompatibility from './extension-metadata-compatibility.vue';
import ExtensionMetadataDate from './extension-metadata-date.vue';
import ExtensionMetadataDownloads from './extension-metadata-downloads.vue';
import ExtensionMetadataSize from './extension-metadata-size.vue';
import ExtensionMetadataVersion from './extension-metadata-version.vue';

const props = defineProps<{
	extension: RegistryDescribeResponse;
}>();

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
	</v-list>
</template>
