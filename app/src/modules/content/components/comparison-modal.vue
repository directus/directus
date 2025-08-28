<script setup lang="ts">
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { ContentVersion, Field, User } from '@directus/types';
import { isNil } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ComparisonHeader from './comparison-header.vue';

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

const selectedComparisonFields = ref<string[]>([]);

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

// const isOutdated = computed(() => comparedData.value?.outdated ?? false);

const mainHash = computed(() => comparedData.value?.mainHash ?? '');

const versionDateUpdated = computed(() => {
	if (!currentVersion.value.date_updated) return null;
	return new Date(currentVersion.value.date_updated);
});

const mainItemDateUpdated = computed(() => {
	if (!comparedData.value?.main) return null;

	// Check for common date updated field names
	const dateField =
		comparedData.value.main.date_updated || comparedData.value.main.modified_on || comparedData.value.main.updated_on;

	if (!dateField) return null;
	return new Date(dateField);
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

	return availableFields.length > 0 && availableFields.every((field) => selectedComparisonFields.value.includes(field));
});

const someFieldsSelected = computed(() => {
	if (!comparedData.value) return false;

	const availableFields = Object.keys(comparedData.value.current).filter((fieldKey) =>
		comparedFields.value.some((field) => field.field === fieldKey),
	);

	return availableFields.length > 0 && availableFields.some((field) => selectedComparisonFields.value.includes(field));
});

const availableFieldsCount = computed(() => {
	if (!comparedData.value) return 0;

	return Object.keys(comparedData.value.current).filter((fieldKey) =>
		comparedFields.value.some((field) => field.field === fieldKey),
	).length;
});

const comparisonFields = computed(() => {
	if (!comparedData.value) return new Set<string>();

	return new Set(
		Object.keys(comparedData.value.current).filter((fieldKey) =>
			comparedFields.value.some((field) => field.field === fieldKey),
		),
	);
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
	selectedComparisonFields.value = [...selectedComparisonFields.value, field];
}

function removeField(field: string) {
	selectedComparisonFields.value = selectedComparisonFields.value.filter((f: string) => f !== field);
}

function toggleSelectAll() {
	if (!comparedData.value) return;

	const availableFields = Object.keys(comparedData.value.current).filter((fieldKey) =>
		comparedFields.value.some((field) => field.field === fieldKey),
	);

	if (allFieldsSelected.value) {
		selectedComparisonFields.value = [];
	} else {
		selectedComparisonFields.value = [...new Set([...selectedComparisonFields.value, ...availableFields])];
	}
}

function toggleComparisonField(fieldKey: string) {
	if (selectedComparisonFields.value.includes(fieldKey)) {
		removeField(fieldKey);
	} else {
		addField(fieldKey);
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

		selectedComparisonFields.value = Object.keys(result.current).filter((fieldKey) =>
			comparedFieldsKeys.includes(fieldKey),
		);

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
		if (selectedComparisonFields.value.length === 0) return;

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
				unref(selectedComparisonFields).length > 0
					? { mainHash: unref(mainHash), fields: unref(selectedComparisonFields) }
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
			<div class="scrollable-container">
				<div class="columns vertical-divider">
					<div class="col left">
						<ComparisonHeader
							:title="t('main_version')"
							:date-updated="mainItemDateUpdated"
							:user-updated="mainItemUserUpdated"
							:user-loading="mainItemUserLoading"
						/>
						<div class="comparison-content-divider"></div>
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
					<div class="col right">
						<ComparisonHeader
							:title="currentVersionDisplayName"
							:date-updated="versionDateUpdated"
							:user-updated="userUpdated"
							:user-loading="userLoading"
						/>
						<div class="comparison-content-divider"></div>
						<div class="comparison-content">
							<v-form
								disabled
								:collection="currentVersion.collection"
								:primary-key="currentVersion.item"
								:initial-values="previewData"
								:comparison-mode="!!comparedData"
								:selected-comparison-fields="selectedComparisonFields"
								:comparison-fields="comparisonFields"
								:on-toggle-comparison-field="toggleComparisonField"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="footer">
				<div class="columns">
					<div class="col left">
						<div class="fields-changed">
							{{ t('updated_field_count', { count: availableFieldsCount }, availableFieldsCount) }}
						</div>
					</div>
					<div class="col right">
						<div class="select-all-container">
							<v-checkbox
								:model-value="allFieldsSelected"
								:indeterminate="someFieldsSelected && !allFieldsSelected"
								@update:model-value="toggleSelectAll"
							>
								{{ t('select_all_changes') }} ({{ selectedComparisonFields.length }}/{{ availableFieldsCount }})
							</v-checkbox>
						</div>
						<v-button secondary @click="$emit('cancel')">
							<v-icon name="close" left />
							{{ t('cancel') }}
						</v-button>
						<v-button
							v-tooltip.bottom="
								selectedComparisonFields.length === 0 ? t('promote_version_disabled') : t('promote_version')
							"
							:disabled="selectedComparisonFields.length === 0"
							:loading="promoting"
							@click="onPromoteClick"
						>
							<v-icon name="arrow_upload_progress" left />
							{{ t('promote_version') }}
						</v-button>
					</div>
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
	overflow: hidden;

	.comparison-content-divider {
		border-block-start: 2px solid var(--theme--border-color-subdued);
	}

	.scrollable-container {
		flex: 1 1 auto;
		overflow: auto;
	}

	.columns {
		display: flex;
		align-items: stretch;
		min-block-size: 100%;
		position: relative;
	}

	.vertical-divider::after {
		content: '';
		position: absolute;
		inset-block: 0;
		inset-inline-start: 50%;

		/* Border width */
		inline-size: 2px;

		/* Custom dash pattern using repeating-linear-gradient */
		/*
			Pattern explanation (top-to-bottom):
			- var(--theme--border-color-accent) 0:       start of a dash
			- var(--theme--border-color-accent) 4px:     dash length = 4px
			- transparent 4px:                           start of the gap
			- transparent 8px:                           gap end = 8px total, so gap = 4px
			This creates a repeating 4px dash followed by a 4px gap (total cycle = 8px).
		*/
		background: repeating-linear-gradient(to bottom, var(--theme--border-color-accent) 0 4px, transparent 4px 8px);
		pointer-events: none;
	}

	.col {
		flex: 1 1 50%;
		min-inline-size: 0;
	}

	.comparison-content {
		padding-inline: var(--comparison-modal-padding-x);
		padding-block: var(--comparison-modal-padding-x);
	}

	.comparison-divider {
		border-inline-end: 2px dashed var(--theme--border-color-subdued);
		background: var(--theme--background);
	}

	.footer {
		flex: 0 0 auto;
		justify-content: space-between;
		padding-inline: var(--comparison-modal-padding-x);
		padding-block: var(--comparison-modal-padding-y);
		border-block-start: 2px solid var(--theme--border-color-subdued);

		.col.left {
			display: flex;
			align-items: center;
			gap: 24px;

			.fields-changed {
				font-size: 14px;
				line-height: 20px;
				color: var(--theme--foreground-subdued);
				font-weight: 600;
			}
		}

		.col.right {
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
