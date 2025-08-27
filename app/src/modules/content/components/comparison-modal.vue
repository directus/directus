<script setup lang="ts">
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';
import { localizedFormat } from '@/utils/localized-format';
import { ContentVersion, Field, User } from '@directus/types';
import { isNil } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type Comparison = {
	outdated: boolean;
	mainHash: string;
	current: Record<string, any>;
	main: Record<string, any>;
};

interface Props {
	active: boolean;
	currentVersion: ContentVersion;
	deleteVersionsAllowed: boolean;
}

const { t } = useI18n();

const fieldsStore = useFieldsStore();

const props = defineProps<Props>();

const { active, currentVersion, deleteVersionsAllowed } = toRefs(props);

const selectedFields = ref<string[]>([]);

const comparedData = ref<Comparison | null>(null);

const loading = ref(false);
const userUpdated = ref<User | null>(null);
const userLoading = ref(false);
const mainItemUserUpdated = ref<User | null>(null);
const mainItemUserLoading = ref(false);

const { confirmDeleteOnPromoteDialogActive, onPromoteClick, promoting, promote } = usePromoteDialog();

const emit = defineEmits<{
	cancel: [];
	promote: [deleteOnPromote: boolean];
}>();

const currentVersionDisplayName = computed(() =>
	isNil(currentVersion.value.name) ? currentVersion.value.key : currentVersion.value.name,
);

const isOutdated = computed(() => comparedData.value?.outdated ?? false);

const mainHash = computed(() => comparedData.value?.mainHash ?? '');

const versionDateUpdated = computed(() => {
	if (!currentVersion.value.date_updated) return null;
	return new Date(currentVersion.value.date_updated);
});

const versionUserUpdated = computed(() => {
	if (!userUpdated.value) return null;
	return userName(userUpdated.value);
});

const mainItemDateUpdated = computed(() => {
	if (!comparedData.value?.main) return null;

	// Check for common date updated field names
	const dateField =
		comparedData.value.main.date_updated || comparedData.value.main.modified_on || comparedData.value.main.updated_on;

	if (!dateField) return null;
	return new Date(dateField);
});

const mainItemUserUpdatedName = computed(() => {
	if (!mainItemUserUpdated.value) return null;
	return userName(mainItemUserUpdated.value);
});

const comparedFields = computed<Field[]>(() => {
	if (comparedData.value === null) return [];

	return Object.keys(comparedData.value.current)
		.map((fieldKey) => fieldsStore.getField(unref(currentVersion).collection, fieldKey))
		.filter((field) => !!field && !isPrimaryKey(field)) as Field[];

	function isPrimaryKey(field: Field) {
		return (
			field.schema?.is_primary_key === true &&
			(field.schema?.has_auto_increment === true || field.meta?.special?.includes('uuid'))
		);
	}
});

const allFieldsSelected = computed(() => {
	if (!comparedData.value) return false;

	const availableFields = Object.keys(comparedData.value.current).filter((fieldKey) =>
		comparedFields.value.some((field) => field.field === fieldKey),
	);

	return availableFields.length > 0 && availableFields.every((field) => selectedFields.value.includes(field));
});

const someFieldsSelected = computed(() => {
	if (!comparedData.value) return false;

	const availableFields = Object.keys(comparedData.value.current).filter((fieldKey) =>
		comparedFields.value.some((field) => field.field === fieldKey),
	);

	return availableFields.length > 0 && availableFields.some((field) => selectedFields.value.includes(field));
});

const availableFieldsCount = computed(() => {
	if (!comparedData.value) return 0;

	return Object.keys(comparedData.value.current).filter((fieldKey) =>
		comparedFields.value.some((field) => field.field === fieldKey),
	).length;
});

const previewData = computed(() => {
	if (!comparedData.value) return null;
	return comparedData.value.current;
});

watch(
	active,
	(value) => {
		if (value) {
			getComparison();
			fetchUserUpdated();
		}
	},
	{ immediate: true },
);

function addField(field: string) {
	selectedFields.value = [...selectedFields.value, field];
}

function removeField(field: string) {
	selectedFields.value = selectedFields.value.filter((f) => f !== field);
}

function toggleSelectAll() {
	if (!comparedData.value) return;

	const availableFields = Object.keys(comparedData.value.current).filter((fieldKey) =>
		comparedFields.value.some((field) => field.field === fieldKey),
	);

	if (allFieldsSelected.value) {
		selectedFields.value = [];
	} else {
		selectedFields.value = [...new Set([...selectedFields.value, ...availableFields])];
	}
}

async function getComparison() {
	loading.value = true;

	try {
		const result: Comparison = await api
			.get(`/versions/${unref(currentVersion).id}/compare`)
			.then((res) => res.data.data);

		comparedData.value = result;

		const comparedFieldsKeys = comparedFields.value.map((field) => field.field);

		selectedFields.value = Object.keys(result.current).filter((fieldKey) => comparedFieldsKeys.includes(fieldKey));

		// Fetch main item user after comparison data is loaded
		await fetchMainItemUserUpdated();
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

async function fetchUserUpdated() {
	// Try user_updated first, fallback to user_created if not available
	const userId = currentVersion.value.user_updated || currentVersion.value.user_created;
	if (!userId) return;

	userLoading.value = true;

	try {
		const response = await api.get(`/users/${userId}`, {
			params: {
				fields: ['id', 'first_name', 'last_name', 'email'],
			},
		});

		userUpdated.value = response.data.data;
	} catch (error) {
		unexpectedError(error);
	} finally {
		userLoading.value = false;
	}
}

async function fetchMainItemUserUpdated() {
	if (!comparedData.value?.main) return;

	// Check for common user updated field names, with fallback to user_created
	const userField = comparedData.value.main.user_updated || comparedData.value.main.user_created;

	if (!userField) return;

	mainItemUserLoading.value = true;

	try {
		const response = await api.get(`/users/${userField}`, {
			params: {
				fields: ['id', 'first_name', 'last_name', 'email'],
			},
		});

		mainItemUserUpdated.value = response.data.data;
	} catch (error) {
		unexpectedError(error);
	} finally {
		mainItemUserLoading.value = false;
	}
}

function usePromoteDialog() {
	const confirmDeleteOnPromoteDialogActive = ref(false);
	const promoting = ref(false);

	return { confirmDeleteOnPromoteDialogActive, onPromoteClick, promoting, promote };

	function onPromoteClick() {
		if (selectedFields.value.length === 0) return;

		if (deleteVersionsAllowed.value) {
			confirmDeleteOnPromoteDialogActive.value = true;
		} else {
			promote(false);
		}
	}

	async function promote(deleteOnPromote: boolean) {
		if (promoting.value) return;

		promoting.value = true;

		try {
			await api.post(
				`/versions/${unref(currentVersion).id}/promote`,
				unref(selectedFields).length > 0
					? { mainHash: unref(mainHash), fields: unref(selectedFields) }
					: { mainHash: unref(mainHash) },
			);

			confirmDeleteOnPromoteDialogActive.value = false;

			emit('promote', deleteOnPromote);
		} catch (error) {
			unexpectedError(error);
		} finally {
			promoting.value = false;
		}
	}
}
</script>

<template>
	<v-dialog
		:model-value="active"
		persistent
		:loading="loading"
		@update:model-value="$emit('cancel')"
		@esc="$emit('cancel')"
	>
		<div class="comparison-modal">
			<div class="preview-comparison">
				<div class="comparison-side main-side">
					<div class="side-header">
						<div class="header-content">
							<h3>{{ t('main_version') }}</h3>
						</div>
						<div class="header-meta">
							<div class="meta-info">
								<div v-if="mainItemDateUpdated" class="date-time">
									{{ localizedFormat(mainItemDateUpdated, String(t('date-fns_date_short'))) }}
									{{ localizedFormat(mainItemDateUpdated, String(t('date-fns_time'))) }}
								</div>
								<div v-if="mainItemUserUpdatedName" class="user-info">
									{{ t('edited_by') }} {{ mainItemUserUpdatedName }}
								</div>
								<div v-else-if="mainItemUserLoading" class="user-info">
									{{ t('loading') }}
								</div>
								<div v-else class="user-info">{{ t('edited_by') }} {{ t('unknown_user') }}</div>
							</div>
						</div>
					</div>
					<div class="comparison-content">
						<v-form
							disabled
							:collection="currentVersion.collection"
							:primary-key="currentVersion.item"
							:initial-values="comparedData?.main"
						/>
					</div>
				</div>
				<div class="comparison-divider"></div>
				<div class="comparison-side version-side">
					<div class="side-header">
						<div class="header-content">
							<h3>{{ currentVersionDisplayName }}</h3>
						</div>
						<div class="header-meta">
							<div class="meta-info">
								<div v-if="versionDateUpdated" class="date-time">
									{{ localizedFormat(versionDateUpdated, String(t('date-fns_date_short'))) }}
									{{ localizedFormat(versionDateUpdated, String(t('date-fns_time'))) }}
								</div>
								<div v-if="versionUserUpdated" class="user-info">{{ t('edited_by') }} {{ versionUserUpdated }}</div>
								<div v-else-if="userLoading" class="user-info">
									{{ t('loading') }}
								</div>
								<div v-else class="user-info">{{ t('edited_by') }} {{ t('unknown_user') }}</div>
							</div>
						</div>
					</div>
					<div class="comparison-content">
						<v-form
							disabled
							:collection="currentVersion.collection"
							:primary-key="currentVersion.item"
							:initial-values="previewData"
						/>
					</div>
				</div>
			</div>
			<div class="comparison-footer">
				<div class="comparison-footer-col-1">
					<div class="fields-changed">
						{{ t('updated_field_count', { count: selectedFields.length }, selectedFields.length) }}
					</div>
				</div>
				<div class="comparison-footer-col-2">
					<div class="select-all-container">
						<v-checkbox
							:model-value="allFieldsSelected"
							:indeterminate="someFieldsSelected && !allFieldsSelected"
							@update:model-value="toggleSelectAll"
						>
							{{ t('select_all_changes') }} ({{ selectedFields.length }}/{{ availableFieldsCount }})
						</v-checkbox>
					</div>
					<v-button secondary @click="$emit('cancel')">
						<v-icon name="close" left />
						{{ t('cancel') }}
					</v-button>
					<v-button
						v-tooltip.bottom="selectedFields.length === 0 ? t('promote_version_disabled') : t('promote_version')"
						:disabled="selectedFields.length === 0"
						:loading="promoting"
						@click="onPromoteClick"
					>
						<v-icon name="arrow_upload_progress" left />
						{{ t('promote_version') }}
					</v-button>
				</div>
			</div>
		</div>

		<v-dialog
			v-model="confirmDeleteOnPromoteDialogActive"
			@esc="confirmDeleteOnPromoteDialogActive = false"
			@apply="promote(true)"
		>
			<v-card>
				<v-card-title>
					{{ t('delete_on_promote_copy', { version: currentVersionDisplayName }) }}
				</v-card-title>
				<v-card-actions>
					<v-button secondary @click="promote(false)">{{ t('keep') }}</v-button>
					<v-button :loading="promoting" kind="danger" @click="promote(true)">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-dialog>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.comparison-modal {
	--comparison-modal-padding-x: 28px;
	--comparison-modal-padding-y: 20px;
	--comparison-modal-height: 90vh;
	--comparison-modal-width: 90vw;
	background: var(--theme--background);
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--shadow);
	display: flex;
	flex-direction: column;
	block-size: var(--comparison-modal-height);
	inline-size: var(--comparison-modal-width);

	.preview-comparison {
		display: flex;
		overflow-y: auto;
		flex: 1;
	}

	.comparison-side {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.comparison-content {
		padding-inline: var(--comparison-modal-padding-x);
		padding-block: var(--comparison-modal-padding-x);
	}

	.side-header {
		display: flex;
		padding-block: var(--comparison-modal-padding-y);
		padding-inline: var(--comparison-modal-padding-x);
		justify-content: space-between;
		align-items: center;
		align-self: stretch;
		gap: 16px;

		.header-content {
			flex: 1;

			h3 {
				font-size: 20px;
				font-weight: 600;
				line-height: 32px;
				color: var(--theme--foreground);
				margin: 0;
			}
		}

		.header-meta {
			flex-shrink: 0;
			min-inline-size: 0;

			.meta-info {
				text-align: end;

				.date-time {
					font-size: 14px;
					font-weight: 500;
					line-height: 20px;
					color: var(--theme--foreground);
					margin-block-end: 4px;
				}

				.user-info {
					font-size: 14px;
					line-height: 20px;
					color: var(--theme--foreground-subdued);
				}
			}
		}
	}

	.comparison-divider {
		border-inline-end: 2px dashed var(--theme--border-color-subdued);
		background: var(--theme--background);
	}

	.comparison-footer {
		display: flex;
		justify-content: space-between;
		padding-inline: var(--comparison-modal-padding-x);
		padding-block: var(--comparison-modal-padding-y);
		border-block-start: 2px solid var(--theme--border-color-subdued);

		.comparison-footer-col-1 {
			display: flex;
			align-items: center;
			gap: 8px;

			.fields-changed {
				font-size: 14px;
				line-height: 20px;
				color: var(--theme--foreground-subdued);
				font-weight: 600;
			}
		}

		.comparison-footer-col-2 {
			flex: 1;
			display: flex;
			justify-content: flex-end;
			align-items: center;
			gap: 24px;

			.select-all-container {
				min-inline-size: 200px;
				flex-shrink: 0;
			}
		}
	}
}
</style>
