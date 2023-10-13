<script setup lang="ts">
import FilePreview, { type Props as FilePreviewProps } from '@/views/private/components/file-preview.vue';
import { useSync } from '@directus/composables';

interface Props extends FilePreviewProps {
	modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
}>();

const internalModelValue = useSync(props, 'modelValue', emit);
</script>

<template>
	<v-dialog v-model="internalModelValue" @esc="internalModelValue = false">
		<template #activator="activatorBinding">
			<slot name="activator" v-bind="activatorBinding" />
		</template>

		<file-preview :file="file" :preset="null" in-modal @click="internalModelValue = false" />

		<v-button class="close" icon rounded @click="internalModelValue = false">
			<v-icon name="close" />
		</v-button>
	</v-dialog>
</template>

<style scoped>
.file-preview {
	width: 85%;
	height: 85%;
	max-width: initial;
}

.close {
	--v-button-background-color: var(--white);
	--v-button-color: var(--theme--foreground-subdued);
	--v-button-background-color-hover: var(--white);
	--v-button-color-hover: var(--theme--foreground);

	position: absolute;
	top: 32px;
	right: 32px;
}
</style>
