<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VUpload from '@/components/v-upload.vue';
import FilePreview, { type Props as FilePreviewProps } from '@/views/private/components/file-preview.vue';
import { ref } from 'vue';

defineProps<FilePreviewProps>();

const emit = defineEmits<{
	click: [];
	replace: [];
}>();

const dialogActive = ref(false);

function onInput() {
	dialogActive.value = false;
	emit('replace');
}

function close() {
	dialogActive.value = false;
}
</script>

<template>
	<div class="file-preview-replace">
		<file-preview :file="file" />

		<button class="replace-toggle" @click="dialogActive = true">
			{{ $t('replace_file') }}
		</button>

		<v-dialog :model-value="dialogActive" @esc="close">
			<v-card>
				<v-card-title>{{ $t('replace_file') }}</v-card-title>
				<v-card-text>
					<v-upload :file-id="file.id" from-url @input="onInput" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="close">{{ $t('done') }}</v-button>
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
	margin-block-start: 12px;
}
</style>
