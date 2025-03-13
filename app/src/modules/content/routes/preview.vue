<script setup lang="ts">
import { useTemplateData } from '@/composables/use-template-data';
import { useVersions } from '@/composables/use-versions';
import { renderStringTemplate } from '@/utils/render-string-template';
import LivePreview from '@/views/private/components/live-preview.vue';
import { useCollection } from '@directus/composables';
import { computed, toRefs } from 'vue';

const props = defineProps<{
	collection: string;
	primaryKey: string;
}>();

const { collection, primaryKey } = toRefs(props);

const { info: collectionInfo, isSingleton } = useCollection(collection);

const { currentVersion } = useVersions(collection, isSingleton, primaryKey);

const previewTemplate = computed(() => collectionInfo.value?.meta?.preview_url ?? '');

const { templateData: previewData } = useTemplateData(collectionInfo, primaryKey, {
	template: previewTemplate,
	injectData: computed(() => ({ $version: currentVersion.value?.key ?? 'main' })),
});

const previewUrl = computed(() => {
	const { displayValue } = renderStringTemplate(previewTemplate.value, previewData.value);
	return displayValue.value || null;
});

function closePopup() {
	window.close();
}
</script>

<template>
	<LivePreview v-if="previewUrl" :url="previewUrl" in-popup @new-window="closePopup" />
</template>
