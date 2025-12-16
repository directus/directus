<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VUpload from '@/components/v-upload.vue';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useRouter } from 'vue-router';

const props = defineProps<{
	folder?: string;
}>();

const router = useRouter();

const isOpen = useDialogRoute();

function close() {
	router.push(props.folder ? { path: `/files/folders/${props.folder}` } : { path: '/files' });
}
</script>

<template>
	<v-dialog :model-value="isOpen" @update:model-value="close" @esc="close">
		<v-card>
			<v-card-title>{{ $t('add_file') }}</v-card-title>
			<v-card-text>
				<v-upload :folder="props.folder" multiple from-url @input="close" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">{{ $t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
