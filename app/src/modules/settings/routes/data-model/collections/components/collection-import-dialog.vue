<template>
	<v-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
		<v-card>
			<v-card-title class="centered-title">{{ t('import_collection') }}</v-card-title>

			<v-card-text>
				<div class="tabs-container">
					<v-tabs v-model="activeTab" class="styled-tabs">
						<v-tab value="upload">{{ t('upload_file') }}</v-tab>
						<v-tab value="paste">{{ t('paste_json') }}</v-tab>
					</v-tabs>

					<v-tabs-items v-model="activeTab" class="tab-content">
						<!-- Upload File Tab -->
						<v-tab-item value="upload">
							<div class="upload-container">
								<input
									ref="fileInput"
									type="file"
									accept="application/json,.json"
									style="display: none"
									@change="handleFileSelect"
								/>
								<v-button v-if="!selectedFile" class="upload-button" @click="fileInput?.click()">
									<v-icon name="upload" left />
									{{ t('choose_file') }}
								</v-button>
								<div v-else class="file-selected">
									<v-icon name="description" />
									<span class="file-name">{{ selectedFile.name }}</span>
									<v-icon name="close" clickable @click="clearFile" />
								</div>
								<div v-if="parseError" class="error-message">
									<v-notice type="danger">{{ parseError }}</v-notice>
								</div>
							</div>
						</v-tab-item>

						<!-- Paste JSON Tab -->
						<v-tab-item value="paste">
							<div class="paste-container">
								<div class="code-editor-wrapper">
									<interface-input-code
										:value="pastedJson"
										:placeholder="t('paste_collection_json_here')"
										:line-number="true"
										:line-wrapping="true"
										language="json"
										@input="pastedJson = $event"
									/>
								</div>
								<div v-if="parseError" class="error-message">
									<v-notice type="danger">{{ parseError }}</v-notice>
								</div>
							</div>
						</v-tab-item>
					</v-tabs-items>
				</div>

				<!-- Preview Section -->
				<div v-if="parsedSnapshot && !parseError" class="preview-section">
					<v-divider />
					<div class="preview-header">
						<h3>{{ t('preview') }}</h3>
					</div>
					<div class="preview-content">
						<v-notice v-if="collectionExists" type="info">
							{{ t('collection_exists_will_merge', { collection: parsedSnapshot.collection }) }}
						</v-notice>
						<v-notice v-else type="success">
							<div>{{ t('will_create_collection', { collection: parsedSnapshot.collection }) }}</div>
							<div v-if="parsedSnapshot.dependencies?.junctions?.length">
								{{
									t('will_create_junctions', {
										count: parsedSnapshot.dependencies.junctions.length,
										junctions: parsedSnapshot.dependencies.junctions.map((j) => j.collection).join(', '),
									})
								}}
							</div>
						</v-notice>

						<div class="preview-details">
							<div class="preview-item">
								<strong>{{ t('collection') }}:</strong> {{ parsedSnapshot.collection }}
							</div>
							<div class="preview-item">
								<strong>{{ t('fields') }}:</strong> {{ parsedSnapshot.fields.length }}
							</div>
							<div class="preview-item">
								<strong>{{ t('relations') }}:</strong> {{ parsedSnapshot.relations.length }}
							</div>
							<div v-if="parsedSnapshot.dependencies?.junctions?.length" class="preview-item">
								<strong>{{ t('junctions') }}:</strong>
								{{ parsedSnapshot.dependencies.junctions.map((j) => j.collection).join(', ') }}
							</div>
						</div>

						<div v-if="missingDependencies.length > 0" class="warning-section">
							<v-notice type="warning">
								{{ t('missing_dependencies') }}:
								{{ missingDependencies.join(', ') }}
							</v-notice>
						</div>
					</div>
				</div>

				<!-- Import Progress -->
				<div v-if="importing" class="progress-section">
					<v-progress-linear indeterminate />
					<p class="progress-text">{{ t('importing_collection') }}...</p>
				</div>

				<!-- Import Result -->
				<div v-if="importResult" class="result-section">
					<v-notice v-if="importResult.success" type="success">
						{{ t('import_successful', { collection: importResult.collection }) }}
					</v-notice>
					<v-notice v-else type="danger">
						<div>{{ t('import_failed') }}</div>
						<div class="error-detail">{{ importResult.error }}</div>
					</v-notice>
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="close">{{ importResult?.success ? t('close') : t('cancel') }}</v-button>
				<v-button
					v-if="!importResult?.success"
					:disabled="!parsedSnapshot || !!parseError || importing"
					:loading="importing"
					@click="performImport"
				>
					{{ t('import_label') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import type { CollectionSnapshot } from '@directus/types';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';

interface Props {
	modelValue: boolean;
}

interface Emits {
	(e: 'update:modelValue', value: boolean): void;
	(e: 'imported'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const collectionsStore = useCollectionsStore();

const activeTab = ref(['upload']);
const selectedFile = ref<File | null>(null);
const pastedJson = ref('');
const parseError = ref<string | null>(null);
const parsedSnapshot = ref<CollectionSnapshot | null>(null);
const importing = ref(false);
const importResult = ref<{ success: boolean; collection?: string; error?: string } | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const collectionExists = computed(() => {
	if (!parsedSnapshot.value) return false;
	return collectionsStore.collections.some((c) => c.collection === parsedSnapshot.value!.collection);
});

const missingDependencies = computed(() => {
	if (!parsedSnapshot.value) return [];
	const missing: string[] = [];

	// Check for missing related collections in relations
	for (const relation of parsedSnapshot.value.relations) {
		if (
			relation.related_collection &&
			!collectionsStore.collections.some((c) => c.collection === relation.related_collection)
		) {
			if (!missing.includes(relation.related_collection)) {
				missing.push(relation.related_collection);
			}
		}
	}

	// Check for missing dependencies for junctions
	if (parsedSnapshot.value.dependencies?.junctions) {
		for (const junction of parsedSnapshot.value.dependencies.junctions) {
			for (const relation of junction.relations) {
				if (
					relation.related_collection &&
					relation.related_collection !== parsedSnapshot.value.collection &&
					!collectionsStore.collections.some((c) => c.collection === relation.related_collection)
				) {
					if (!missing.includes(relation.related_collection)) {
						missing.push(relation.related_collection);
					}
				}
			}
		}
	}

	return missing;
});

watch([selectedFile, pastedJson], () => {
	parseError.value = null;
	parsedSnapshot.value = null;
	importResult.value = null;

	if (activeTab.value[0] === 'upload' && selectedFile.value) {
		parseFile(selectedFile.value);
	} else if (activeTab.value[0] === 'paste' && pastedJson.value.trim()) {
		parseJson(pastedJson.value);
	}
});

watch(activeTab, () => {
	parseError.value = null;
	parsedSnapshot.value = null;
	importResult.value = null;
});

function handleFileSelect(event: Event) {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (file) {
		selectedFile.value = file;
	}
}

function clearFile() {
	selectedFile.value = null;
	if (fileInput.value) {
		fileInput.value.value = '';
	}
	parseError.value = null;
	parsedSnapshot.value = null;
}

async function parseFile(file: File) {
	try {
		const text = await file.text();
		parseJson(text);
	} catch (error: any) {
		parseError.value = t('failed_to_read_file', { message: error.message });
	}
}

function parseJson(jsonString: string) {
	try {
		const parsed = JSON.parse(jsonString);
		validateSnapshot(parsed);
		parsedSnapshot.value = parsed;
	} catch (error: any) {
		parseError.value = t('invalid_json', { message: error.message });
	}
}

function validateSnapshot(snapshot: any) {
	if (!snapshot.collection || typeof snapshot.collection !== 'string') {
		throw new Error(t('missing_collection_name'));
	}
	if (!Array.isArray(snapshot.fields)) {
		throw new Error(t('invalid_fields_array'));
	}
	if (!Array.isArray(snapshot.relations)) {
		throw new Error(t('invalid_relations_array'));
	}
}

async function performImport() {
	if (!parsedSnapshot.value) return;

	importing.value = true;
	importResult.value = null;

	try {
		await api.post('/schema/collections/import', parsedSnapshot.value);

		importResult.value = {
			success: true,
			collection: parsedSnapshot.value.collection,
		};

		// Refresh collections store
		await collectionsStore.hydrate();

		// Emit imported event for parent to refresh
		emit('imported');
	} catch (error: any) {
		importResult.value = {
			success: false,
			error: error.response?.data?.errors?.[0]?.message || error.message || t('unknown_error'),
		};
	} finally {
		importing.value = false;
	}
}

function close() {
	emit('update:modelValue', false);

	// Reset state after dialog closes
	setTimeout(() => {
		activeTab.value = ['upload'];
		selectedFile.value = null;
		pastedJson.value = '';
		parseError.value = null;
		parsedSnapshot.value = null;
		importing.value = false;
		importResult.value = null;
	}, 300);
}
</script>

<style scoped>
.v-dialog :deep(.v-card) {
	--v-card-min-width: 1400px !important;
	--v-card-max-width: 1400px !important;
	inline-size: 1400px !important;
	max-inline-size: 1400px !important;
	min-inline-size: 1400px !important;
}

.centered-title {
	text-align: center;
}

.tabs-container {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.styled-tabs {
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	padding: 4px;
}

.upload-container {
	padding: var(--content-padding);
	padding-block-end: 0;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.upload-button {
	align-self: flex-start;
}

.file-selected {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
}

.file-name {
	flex: 1;
	font-family: var(--theme--fonts--monospace--font-family);
}

.paste-container {
	padding: var(--content-padding);
	padding-inline: 0;
}

.code-editor-wrapper {
	max-block-size: 200px;
	border: 1px solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	overflow: hidden;
}

.code-editor-wrapper :deep(.interface-input-code) {
	max-block-size: 200px;
}

.error-message {
	margin-block-start: 12px;
}

.preview-section {
	margin-block-start: 24px;
}

.preview-header {
	padding: 12px 0;
}

.preview-header h3 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
}

.preview-content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.preview-details {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 14px;
}

.preview-item {
	display: flex;
	gap: 8px;
}

.warning-section {
	margin-block-start: 8px;
}

.progress-section {
	margin-block-start: 24px;
	padding: 16px;
	text-align: center;
}

.progress-text {
	margin-block-start: 12px;
	color: var(--theme--foreground-subdued);
}

.result-section {
	margin-block-start: 24px;
}

.error-detail {
	margin-block-start: 8px;
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 12px;
	opacity: 0.8;
}
</style>
