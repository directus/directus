<script setup lang="ts">
import { extensionTypeIconMap } from '@/constants/extension-type-icon-map';
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import type { RegistryListResponse } from '@directus/extensions-registry';
import { abbreviateNumber } from '@directus/utils';
import { computed } from 'vue';

const props = defineProps<{
	extension: RegistryListResponse['data'][number];
}>();

const icon = computed(() => extensionTypeIconMap[props.extension.type]);

const latestVersion = computed(() => props.extension.versions.at(0)!);
</script>

<template>
	<v-list-item class="extension-list-item" block clickable :to="`/settings/marketplace/${extension.id}`">
		<div class="icon"><v-icon :name="icon" /></div>
		<v-list-item-content>
			<div class="name">{{ extension.name }}</div>
			<div class="author">
				{{ latestVersion.publisher.github_name ?? latestVersion.publisher.username }}
				<v-icon v-if="latestVersion.publisher.verified" name="verified" x-small />
			</div>
			<div class="description">{{ extension.description }}</div>
		</v-list-item-content>
		<div class="meta">
			<div class="published">
				{{ localizedFormatDistanceStrict(new Date(latestVersion.publish_date), new Date()) }}
				<v-icon small name="restore" />
			</div>

			<div class="downloads">
				{{ abbreviateNumber(extension.downloads) }}
				<v-icon small name="download" />
			</div>
		</div>
	</v-list-item>
</template>

<style scoped>
.extension-list-item {
	--v-list-item-padding: 20px;
}

.icon-container {
	margin: 0;
}

.icon {
	width: 48px;
	height: 48px;
	border-radius: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--theme--primary);
	--v-icon-color: var(--foreground-inverted);
	margin-right: 20px;
}

.name {
	color: var(--theme--foreground-accent);
}

.author {
	color: var(--theme--primary);
}

.description {
	color: var(--theme--foreground-subdued);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.meta {
	margin-inline-start: 20px;
	color: var(--theme--foreground-subdued);
	text-align: end;
}
</style>
