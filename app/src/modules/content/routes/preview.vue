<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { toRefs } from 'vue';
import { usePreviewUrl } from '@/composables/use-preview-url';
import { useVersions } from '@/composables/use-versions';
import { useVisualEditing } from '@/composables/use-visual-editing';
import LivePreview from '@/views/private/components/live-preview.vue';

const props = defineProps<{
	collection: string;
	primaryKey: string;
}>();

const { collection, primaryKey } = toRefs(props);

const { info: collectionInfo, isSingleton } = useCollection(collection);

const { currentVersion } = useVersions(collection, isSingleton, primaryKey);

const { previewUrl } = usePreviewUrl(collectionInfo, primaryKey, currentVersion);

const { visualEditingEnabled } = useVisualEditing({ previewUrl });

function closePopup() {
	window.close();
}

function onSaved() {
	window.opener?.postMessage('refresh', window.location.origin);
}
</script>

<template>
	<LivePreview
		v-if="previewUrl"
		:url="previewUrl"
		:version="currentVersion"
		in-popup
		:can-enable-visual-editing="visualEditingEnabled"
		@new-window="closePopup"
		@saved="onSaved"
	/>
</template>
