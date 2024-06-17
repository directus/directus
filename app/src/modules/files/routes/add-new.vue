<script setup lang="ts">
import { useDialogRoute } from '@/composables/use-dialog-route';
import { ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps<{
	folder?: string;
}>();

const { t } = useI18n();

const router = useRouter();

const isOpen = useDialogRoute();

let uploader: any = null;
const isUploading = ref(false);
const isPaused = ref(false);

function close() {
	uploader?.abort();
	uploader = null;
	isUploading.value = false;
	router.push(props.folder ? { path: `/files/folders/${props.folder}` } : { path: '/files' });
}

function pause() {
	console.log('pause', uploader);
	uploader?.abort();
	isPaused.value = true;
}

function resume() {
	console.log('resume', uploader);
	uploader?.start();
	isUploading.value = true;
	isPaused.value = false;
}

function start(idk) {
	console.log('start')
	uploader = idk;
	isUploading.value = true;
	isPaused.value = false;
}
</script>

<template>
	<v-dialog :model-value="isOpen" @update:model-value="close" @esc="close">
		<v-card>
			<v-card-title>{{ t('add_file') }}</v-card-title>
			<v-card-text>
				<v-upload :folder="props.folder" multiple from-url @input="close" @start="start" />
			</v-card-text>
			<v-card-actions>
				<v-button v-show="isUploading && !isPaused" secondary @click="pause">{{ t('pause') }}</v-button>
				<v-button v-show="isUploading && isPaused" secondary @click="resume">{{ t('resume') }}</v-button>
				<v-button secondary @click="close">{{ t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
