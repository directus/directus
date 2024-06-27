<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import ResumableUploadItem from '@/modules/files/components/resumable-upload-item.vue';
import { PreviousUpload, useResumableUploads } from '@/modules/files/composables/use-resumable-uploads';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const dialogActive = ref(false);
const error = ref<Error | null>(null);
const activeUploads = ref(new Set());

const { uploads: resumableUploads, remove } = useResumableUploads();

const sortedUploads = computed(() => {
	// Sort uploads so that running uploads are listed first
	return [...resumableUploads.value].sort((a, b) => {
		if (activeUploads.value.has(a.urlStorageKey) != activeUploads.value.has(b.urlStorageKey)) {
			if (activeUploads.value.has(a.urlStorageKey)) return -1;
			if (activeUploads.value.has(b.urlStorageKey)) return 1;
		}

		return new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime();
	});
});

function close() {
	dialogActive.value = false;
	error.value = null;
	console.log(dialogActive.value);
}

watch(dialogActive, () => {
	if (!dialogActive.value) {
		error.value = null;
	}
});

function onUploadStarted(upload: PreviousUpload) {
	activeUploads.value.add(upload.urlStorageKey);
}

function onUploadDone(upload: PreviousUpload) {
	activeUploads.value.delete(upload.urlStorageKey);
}
</script>

<template>
	<v-dialog v-if="resumableUploads.length > 0 || dialogActive" v-model="dialogActive" @esc="close">
		<template #activator="{ on }">
			<v-button v-tooltip.bottom="t('resume_uploads')" rounded icon secondary @click="on">
				<v-icon name="clock_loader_40" outline />
			</v-button>
		</template>

		<v-card>
			<v-card-title>
				{{ t('resume_uploads') }}
			</v-card-title>
			<v-card-text>
				<span v-if="resumableUploads.length === 0" class="empty">{{ t('no_resumable_uploads') }}</span>
				<template v-else>
					<div class="info">
						{{ t('resumable_uploads_info') }}
					</div>
					<v-notice v-if="error" type="danger">
						{{ error.response?.data?.errors?.[0]?.message || error?.message }}
					</v-notice>
					<v-divider />
					<v-list>
						<resumable-upload-item
							v-for="upload in sortedUploads"
							:key="upload.urlStorageKey"
							:upload="upload"
							@upload="onUploadStarted(upload)"
							@done="onUploadDone(upload)"
							@error="error = $event"
							@remove="remove(upload.urlStorageKey)"
						/>
					</v-list>
				</template>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">{{ t('cancel') }}</v-button>
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
	margin-top: 24px;
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
}

.v-error {
	flex-shrink: 0;
}

.v-list {
	overflow-y: auto;
}
</style>
