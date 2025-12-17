<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
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
	<VDialog v-model="internalModelValue" @esc="internalModelValue = false">
		<template #activator="activatorBinding">
			<slot name="activator" v-bind="activatorBinding" />
		</template>

		<FilePreview :file="file" :preset="null" in-modal @click="internalModelValue = false" />

		<VButton class="close" icon rounded @click="internalModelValue = false">
			<VIcon name="close" />
		</VButton>
	</VDialog>
</template>

<style scoped>
.file-preview {
	inline-size: 85%;
	block-size: 85%;
	max-inline-size: initial;
}

.close {
	--v-button-background-color: var(--white);
	--v-button-color: var(--theme--foreground-subdued);
	--v-button-background-color-hover: var(--white);
	--v-button-color-hover: var(--theme--foreground);

	position: absolute;
	inset-block-start: 32px;
	inset-inline-end: 32px;
}
</style>
