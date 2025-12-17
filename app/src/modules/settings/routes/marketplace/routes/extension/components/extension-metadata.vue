<script setup lang="ts">
import VList from '@/components/v-list.vue';
import { RegistryDescribeResponse } from '@directus/extensions-registry';
import { computed } from 'vue';
import MetadataItem from '../../../components/metadata-item.vue';
import ExtensionInstall from './extension-install.vue';
import ExtensionMetadataAuthor from './extension-metadata-author.vue';
import ExtensionMetadataCompatibility from './extension-metadata-compatibility.vue';
import ExtensionMetadataDate from './extension-metadata-date.vue';
import ExtensionMetadataDownloadsSparkline from './extension-metadata-downloads-sparkline.vue';
import ExtensionMetadataDownloads from './extension-metadata-downloads.vue';
import ExtensionMetadataLicense from './extension-metadata-license.vue';
import ExtensionMetadataSize from './extension-metadata-size.vue';
import ExtensionMetadataVersion from './extension-metadata-version.vue';

const props = defineProps<{
	extension: RegistryDescribeResponse['data'];
}>();

const latestVersion = computed(() => props.extension.versions.at(0)!);

const maintainers = computed(() => {
	const publisherId = latestVersion.value.publisher.id;

	return (
		latestVersion.value.maintainers
			?.filter(({ accounts_id: maintainer }) => maintainer.id !== publisherId)
			.map(({ accounts_id: maintainer }) => maintainer) ?? []
	);
});
</script>

<template>
	<div class="metadata">
		<VList class="list">
			<div class="grid buttons">
				<ExtensionInstall :extension-id="extension.id" :version-id="latestVersion.id" />
				<ExtensionMetadataAuthor
					:id="latestVersion.publisher.id"
					:verified="latestVersion.publisher.verified"
					:username="latestVersion.publisher.username"
					:github-name="latestVersion.publisher.github_name"
					:github-avatar-url="latestVersion.publisher.github_avatar_url"
				/>

				<ExtensionMetadataAuthor
					v-for="maintainer of maintainers"
					:id="maintainer.id"
					:key="maintainer.id"
					:verified="maintainer.verified"
					:username="maintainer.username"
					:github-name="maintainer.github_name"
					:github-avatar-url="maintainer.github_avatar_url"
				/>
			</div>
		</VList>
		<VList class="list">
			<div class="grid">
				<ExtensionMetadataDownloadsSparkline
					v-if="extension.downloads"
					class="sparkline"
					:downloads="extension.downloads"
				/>
				<ExtensionMetadataDownloads :downloads="extension.total_downloads" />
				<ExtensionMetadataVersion :version="latestVersion.version" />
				<ExtensionMetadataCompatibility :host-version="latestVersion.host_version" />
				<ExtensionMetadataDate :publish-date="latestVersion.publish_date" />
				<ExtensionMetadataLicense :license="extension.license" />
				<ExtensionMetadataSize :unpacked-size="latestVersion.unpacked_size" :file-count="latestVersion.file_count" />
				<MetadataItem v-if="latestVersion.url_homepage" icon="link" :href="latestVersion.url_homepage">
					{{ $t('homepage') }}
				</MetadataItem>
				<MetadataItem v-if="latestVersion.url_repository" icon="commit" :href="latestVersion.url_repository">
					{{ $t('repository') }}
				</MetadataItem>
				<MetadataItem v-if="latestVersion.url_bugs" icon="bug_report" :href="latestVersion.url_bugs">
					{{ $t('report_an_issue') }}
				</MetadataItem>
			</div>
		</VList>
	</div>
</template>

<style scoped>
.metadata {
	container-type: inline-size;
	container-name: metadata;
}

.metadata .list:first-child {
	padding-block-start: 0;
}

.grid {
	@container metadata (width > 580px) {
		--v-list-item-margin: 0;

		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 4px 16px;

		.sparkline {
			grid-column: 1 / span 2;
			margin-block-start: 16px;
		}
	}

	&.buttons {
		display: flex;
		flex-direction: column;
		gap: 8px;

		@container metadata (width > 580px) {
			display: grid;
			gap: 8px 16px;
		}
	}
}

.divider {
	margin: 16px 0;
}

.sparkline {
	margin-block: 6px 14px;
}
</style>
