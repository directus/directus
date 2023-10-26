<script setup lang="ts">
import FilePreview, { type Props as FilePreviewProps } from '@/views/private/components/file-preview.vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<FilePreviewProps>();

const emit = defineEmits<{
	click: [];
	replace: [];
}>();

const { t } = useI18n();
const replaceFileDialogActive = ref(false);

function onInput() {
	replaceFileDialogActive.value = false;
	emit('replace');
}
</script>

<template>
	<div class="file-preview-replace">
		<file-preview :file="file" />

		<button class="replace-toggle" @click="replaceFileDialogActive = true">
			{{ t('replace_file') }}
		</button>

		<v-dialog :model-value="replaceFileDialogActive" @esc="replaceFileDialogActive = false">
			<v-card>
				<v-card-title>{{ t('replace_file') }}</v-card-title>
				<v-card-text>
					<v-upload :file-id="file.id" from-url @input="onInput" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="replaceFileDialogActive = false">{{ t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style scoped>
.replace-toggle {
	color: var(--theme--primary);
	cursor: pointer;
	font-weight: 600;
	margin-top: 12px;
}
</style>
