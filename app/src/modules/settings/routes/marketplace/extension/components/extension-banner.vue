<script setup lang="ts">
import { extensionTypeIconMap } from '@/constants/extension-type-icon-map';
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import type { RegistryDescribeResponse } from '@directus/extensions-registry';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
	extension: RegistryDescribeResponse;
}>();

const icon = computed(() => extensionTypeIconMap[props.extension.type]);
const newestVersion = computed(() => props.extension.versions.at(0)!);
</script>

<template>
	<div class="extension-banner">
		<div class="icon">
			<v-icon :name="icon" />
		</div>

		<p class="badge">{{ t(`extension_${extension.type}`) }}</p>
		<h2 class="name">{{ extension.name }}</h2>
		<p class="meta">
			{{ newestVersion.version }} •
			{{
				t('published_relative', {
					relativeTime: localizedFormatDistanceStrict(new Date(newestVersion.publish_date), new Date(), { addSuffix: true }),
				})
			}}
		</p>
	</div>
</template>

<style scoped lang="scss">
.extension-banner {
	padding: 50px;
	border: 4px dashed hotpink;
}
</style>
