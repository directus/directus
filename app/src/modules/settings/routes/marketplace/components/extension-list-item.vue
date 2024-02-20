<script setup lang="ts">
import { extensionTypeIconMap } from '@/constants/extension-type-icon-map';
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import type { RegistryListResponse } from '@directus/extensions-registry';
import { abbreviateNumber } from '@directus/utils';
import { computed } from 'vue';
import { formatName } from '../utils/format-name';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
	extension: RegistryListResponse['data'][number];
	showType: boolean;
}>();

const icon = computed(() => extensionTypeIconMap[props.extension.type]);
const chip = computed(() => t(`extension_${props.extension.type}`));
</script>

<template>
	<v-list-item class="extension-list-item" block clickable :to="`/settings/marketplace/extension/${extension.id}`">
		<div class="icon"><v-icon :name="icon" /></div>
		<v-list-item-content>
			<div class="name">
				{{ formatName(extension) }}
				<v-chip v-if="showType" outlined x-small class="type-chip">{{ chip }}</v-chip>
			</div>
			<div class="author">
				{{ extension.publisher.github_name ?? extension.publisher.username }}
				<v-icon v-if="extension.publisher.verified" name="verified" x-small />
			</div>
			<div class="description">{{ extension.description }}</div>
		</v-list-item-content>
		<div class="meta">
			<div class="published">
				{{ localizedFormatDistanceStrict(new Date(extension.last_updated), new Date()) }}
				<v-icon small name="event" />
			</div>

			<div class="downloads">
				{{ abbreviateNumber(extension.total_downloads) }}
				<v-icon small name="download" />
			</div>

			<div class="license">
				{{ props.extension.license ?? t('unknown') }}
				<v-icon small name="policy" />
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

.type-chip {
	margin-inline-start: 4px;
	vertical-align: 2px;
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-subdued);
}
</style>
