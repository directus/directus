<template>
	<LivePreview v-if="previewURL" :url="previewURL" inPopup />
</template>

<script setup lang="ts">
import { computed, onMounted, toRefs } from 'vue';
import LivePreview from '../components/live-preview.vue';
import { useCollection } from '@directus/composables';
import { renderStringTemplate } from '@/utils/render-string-template';
import { useTemplateData } from '@/composables/use-template-data';

type Props = {
	collection: string;
	primaryKey: string;
};

const props = defineProps<Props>();

const { collection, primaryKey } = toRefs(props);

const { info: collectionInfo } = useCollection(collection);

const previewTemplate = computed(() => collectionInfo.value?.meta?.preview_url ?? '');

const { templateData: previewData } = useTemplateData(collectionInfo, primaryKey, previewTemplate);

const previewURL = computed(() => {
	const { displayValue } = renderStringTemplate(previewTemplate.value, previewData);

	return displayValue.value || null;
});

onMounted;
</script>
