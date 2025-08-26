<script setup lang="ts">
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { ContentVersion, Field } from '@directus/types';
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

const previewData = computed(() => {
	if (!comparedData.value) return null;

	const data: Record<string, any> = {};

	for (const fieldKey of Object.keys(comparedData.value.main)) {
		data[fieldKey] = selectedFields.value.includes(fieldKey)
			? comparedData.value.current[fieldKey]
			: comparedData.value.main[fieldKey];
	}

	return data;
});

watch(
	active,
	(value) => {
		if (value) getComparison();
	},
	{ immediate: true },
);

function addField(field: string) {
	selectedFields.value = [...selectedFields.value, field];
}

function removeField(field: string) {
	selectedFields.value = selectedFields.value.filter((f) => f !== field);
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
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
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
						<h3>{{ t('main_version') }}</h3>
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
						<h3>{{ currentVersionDisplayName }}</h3>
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
			<div class="modal-actions">
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
		padding-block: var(--comparison-modal-padding-y);
	}

	.side-header {
		border-block-end: 2px solid var(--theme--border-color);
		display: flex;
		padding-block: var(--comparison-modal-padding-y);
		padding-inline: var(--comparison-modal-padding-x);
		justify-content: space-between;
		align-items: center;
		align-self: stretch;
		h3 {
			font-size: 20px;
			font-weight: 600;
			line-height: 32px;
			color: var(--theme--foreground);
		}
	}

	.comparison-divider {
		inline-size: 1px;
		background: repeating-linear-gradient(
			to bottom,
			transparent,
			transparent 4px,
			var(--theme--border-color) 4px,
			var(--theme--border-color) 8px
		);
		margin: 0 var(--content-padding);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		padding-inline: var(--comparison-modal-padding-x);
		padding-block: var(--comparison-modal-padding-y);
		gap: 24px;
	}

	.compare {
		display: flex;
		align-items: center;
		inline-size: 100%;
		padding: 8px;
		gap: 8px;
		color: var(--theme--foreground-subdued);
		background-color: var(--theme--background-subdued);
		cursor: pointer;

		.field-content {
			flex-grow: 1;
		}

		.version {
			text-transform: uppercase;
		}

		&.main {
			border-radius: var(--theme--border-radius) var(--theme--border-radius) 0 0;
			&.active {
				color: var(--theme--secondary);
				background-color: var(--secondary-alt);

				.version {
					color: var(--theme--secondary);
					border-color: var(--theme--secondary);
					background-color: var(--secondary-25);
				}
			}
		}

		&.current {
			border-radius: 0 0 var(--theme--border-radius) var(--theme--border-radius);
			&.active {
				color: var(--theme--primary);
				background-color: var(--theme--primary-background);

				.version {
					color: var(--theme--primary);
					border-color: var(--theme--primary);
					background-color: var(--theme--primary-subdued);
				}
			}
		}
	}
}
</style>
