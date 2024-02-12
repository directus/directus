<script setup lang="ts">
import { RegistryDescribeResponse } from '@directus/extensions-registry';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ExtensionMetadataAuthor from './extension-metadata-author.vue';
import ExtensionMetadataCompatibility from './extension-metadata-compatibility.vue';
import ExtensionMetadataDate from './extension-metadata-date.vue';
import ExtensionMetadataDownloads from './extension-metadata-downloads.vue';
import MetadataItem from '../../../components/metadata-item.vue';
import ExtensionMetadataSize from './extension-metadata-size.vue';
import ExtensionMetadataVersion from './extension-metadata-version.vue';
import ExtensionInstall from './extension-install.vue';

const props = defineProps<{
	extension: RegistryDescribeResponse['data'];
}>();

const { t } = useI18n();

const latestVersion = computed(() => props.extension.versions.at(0)!);
</script>

<template>
	<div class="metadata">
		<v-list class="list">
			<div class="grid">
				<ExtensionInstall class="install" :version-id="latestVersion.id" />
				<ExtensionMetadataAuthor
					:id="latestVersion.publisher.id"
					:verified="latestVersion.publisher.verified"
					:username="latestVersion.publisher.username"
					:github-name="latestVersion.publisher.github_name"
					:github-avatar-url="latestVersion.publisher.github_avatar_url"
					class="author"
				/>
			</div>
		</v-list>
		<v-divider class="divider" />
		<v-list class="list">
			<div class="grid">
				<ExtensionMetadataCompatibility :host-version="latestVersion.host_version" />
				<ExtensionMetadataVersion :version="latestVersion.version" />
				<ExtensionMetadataDownloads :downloads="extension.monthly_downloads" />
				<ExtensionMetadataDate :publish-date="latestVersion.publish_date" />
				<ExtensionMetadataSize :unpacked-size="latestVersion.unpacked_size" :file-count="latestVersion.file_count" />
				<MetadataItem v-if="latestVersion.url_homepage" icon="link" :href="latestVersion.url_homepage">
					{{ t('homepage') }}
				</MetadataItem>
				<MetadataItem v-if="latestVersion.url_repository" icon="commit" :href="latestVersion.url_repository">
					{{ t('repository') }}
				</MetadataItem>
				<MetadataItem v-if="latestVersion.url_bugs" icon="bug_report" :href="latestVersion.url_bugs">
					{{ t('report_an_issue') }}
				</MetadataItem>
			</div>
		</v-list>
	</div>
</template>

<style scoped>
.metadata {
	container-type: inline-size;
	container-name: metadata;
}

.grid {
	.install {
		margin-bottom: 16px !important;
	}

	@container metadata (width > 580px) {
		--v-list-item-margin: 0;

		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 4px 16px;

		.install {
			margin-bottom: 0 !important;
		}
	}
}

.divider {
	margin: 16px 0;
}

.author {
	margin-block-start: 8px;
}
</style>
