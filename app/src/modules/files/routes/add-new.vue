<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VUpload from '@/components/v-upload.vue';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useServerStore } from '@/stores/server';

const props = defineProps<{
	folder?: string;
}>();

const router = useRouter();

const isOpen = useDialogRoute();

const { info } = useServerStore();

const acceptedMimeTypes = computed(() => {
	const allowList = info.files?.mimeTypeAllowList;

	if (!allowList || allowList === '*/*') {
		return undefined;
	}

	return allowList;
});

function close() {
	router.push(props.folder ? { path: `/files/folders/${props.folder}` } : { path: '/files' });
}
</script>

<template>
	<VDialog :model-value="isOpen" @update:model-value="close" @esc="close">
		<VCard>
			<VCardTitle>{{ $t('add_file') }}</VCardTitle>
			<VCardText>
				<VUpload :folder="props.folder" multiple from-url :accept="acceptedMimeTypes" @input="close" />
			</VCardText>
			<VCardActions>
				<VButton secondary @click="close">{{ $t('done') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
