<template>
	<v-dialog :model-value="isOpen" @update:model-value="close" @esc="close">
		<v-card>
			<v-card-title>{{ t('add_file') }}</v-card-title>
			<v-card-text>
				<v-upload :preset="{ folder }" multiple from-url @input="close" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">{{ t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useDialogRoute } from '@/composables/use-dialog-route';

export default defineComponent({
	props: {
		folder: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		const isOpen = useDialogRoute();

		return { t, isOpen, close };

		function close() {
			router.push(props.folder ? { path: `/files/folders/${props.folder}` } : { path: '/files' });
		}
	},
});
</script>
