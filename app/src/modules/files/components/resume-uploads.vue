<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import ResumableUploadItem from '@/modules/files/components/resumable-upload-item.vue';
import { PreviousUpload } from '@/modules/files/composables/use-resumable-uploads';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
	resumableUploads: PreviousUpload[];
}>();

const { t } = useI18n();

const dialogActive = ref(false);
const error = ref<Error | null>(null);
</script>

<template>
	<v-dialog v-model="dialogActive" @esc="dialogActive = false">
		<template #activator="{ on }">
			<v-button v-if="resumableUploads.length > 0" v-tooltip="t('resume_uploads')" rounded icon secondary @click="on">
				<v-icon name="cloud_upload" outline />
			</v-button>
		</template>

		<v-card>
			<v-card-title>
				<div>{{ t('resume_uploads') }}</div>
			</v-card-title>
			<v-card-text>
				<div class="info">
					{{ t('resumable_uploads_info') }}
				</div>
				<v-error v-if="error" :error="error" />
				<v-divider />
				<v-list>
					<span v-if="resumableUploads.length === 0" class="empty">{{ t('no_resumable_uploads') }}</span>
					<resumable-upload-item
						v-for="upload in resumableUploads"
						:key="upload.urlStorageKey"
						:upload="upload"
						@upload="error = null"
						@error="error = $event"
					/>
				</v-list>
				<!--				<v-input v-model="newFolderName" autofocus :placeholder="t('folder_name')" @keyup.enter="addFolder" />-->
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="dialogActive = false">{{ t('cancel') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
.v-list {
	--v-list-item-padding: 6px 0 4px 0;
}

.info {
	color: var(--theme--foreground-subdued);
}

.empty {
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--theme--foreground-subdued);
}

.v-card {
	overflow-y: hidden;
	display: flex;
	flex-direction: column;

	.v-card-text {
		display: flex;
		flex-direction: column;
		overflow-y: hidden;
		gap: 12px;
	}

	.v-card-actions {
		flex-direction: row;
	}
}

.v-error {
	flex-shrink: 0;
}

.v-list {
	overflow-y: auto;
}
</style>
