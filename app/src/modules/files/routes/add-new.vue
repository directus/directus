<script setup lang="ts">
import VUpload, { UploadController } from '@/components/v-upload.vue';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps<{
	folder?: string;
}>();

const { t } = useI18n();

const router = useRouter();

const isOpen = useDialogRoute();
const uploadRef = ref<InstanceType<typeof VUpload> | null>(null);

function close() {
	uploadRef.value?.abort();
	router.push(props.folder ? { path: `/files/folders/${props.folder}` } : { path: '/files' });
}
</script>

<template>
	<v-dialog :model-value="isOpen" @update:model-value="close" @esc="close">
		<v-card>
			<v-card-title>{{ t('add_file') }}</v-card-title>
			<v-card-text>
				<v-upload ref="uploadRef" :folder="props.folder" multiple from-url @input="close" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">{{ t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
