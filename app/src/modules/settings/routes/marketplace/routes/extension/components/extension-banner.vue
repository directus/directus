<script setup lang="ts">
import VBanner from '@/components/v-banner.vue';
import { extensionTypeIconMap } from '@/constants/extension-type-icon-map';
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import type { RegistryDescribeResponse } from '@directus/extensions-registry';
import { computed } from 'vue';
import { formatName } from '../../../utils/format-name';

const props = defineProps<{
	extension: RegistryDescribeResponse['data'];
}>();

const icon = computed(() => extensionTypeIconMap[props.extension.type]);
const newestVersion = computed(() => props.extension.versions.at(0)!);
</script>

<template>
	<VBanner :icon="icon">
		<template #headline>
			<v-chip outlined x-small>{{ $t(`extension_${extension.type}`) }}</v-chip>
		</template>

		<h2 class="name">{{ formatName(extension) }}</h2>

		<template #subtitle>
			<p class="meta">
				v{{ newestVersion.version }} •
				{{
					$t('published_relative', {
						relativeTime: localizedFormatDistanceStrict(new Date(newestVersion.publish_date), new Date(), {
							addSuffix: true,
						}),
					})
				}}
			</p>
		</template>
	</VBanner>
</template>
