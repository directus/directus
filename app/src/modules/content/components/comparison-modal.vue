<script setup lang="ts">
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ContentVersion } from '@directus/types';
import { ref, toRefs, unref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ComparisonHeader from './comparison-header.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import type { ComparisonContext } from '@/components/v-form/types';
import { useComparison } from '../composables/use-comparison';
import { type ComparisonData } from '../comparison-utils';
import { isEqual } from 'lodash';

interface Props {
	active: boolean;
	deleteVersionsAllowed: boolean;
	collection: string;
	primaryKey: string | number;
}

const { t } = useI18n();

const props = defineProps<Props>();

const comparisonData = defineModel<ComparisonData | null>('comparisonData', {
	required: false,
}) as Ref<ComparisonData | null>;

const { active, deleteVersionsAllowed, collection, primaryKey } = toRefs(props);

const {
	selectedComparisonFields,
	userUpdated,
	mainItemUserUpdated,
	mainHash,
	allFieldsSelected,
	someFieldsSelected,
	availableFieldsCount,
	comparisonFields,
	toggleSelectAll,
	toggleComparisonField,
	isVersionMode,
	isRevisionMode,
	isLatestRevision,
	userLoading,
	mainItemUserLoading,
	baseDisplayName,
	deltaDisplayName,
	normalizedData,
	fetchUserUpdated,
	fetchMainItemUserUpdated,
	checkIfLatestRevision,
	normalizeComparisonData,
} = useComparison({
	comparisonData: comparisonData,
});

const modalLoading = ref(false);

const { confirmDeleteOnPromoteDialogActive, onPromoteClick, promoting, promote } = usePromoteDialog();

const emit = defineEmits<{
	cancel: [];
	promote: [deleteOnPromote: boolean];
	confirm: [data?: Record<string, any>];
}>();

watch(
	active,
	async (value) => {
		if (value) {
			modalLoading.value = true;

			try {
				await Promise.allSettled([fetchUserUpdated(), fetchMainItemUserUpdated()]);
			} finally {
				modalLoading.value = false;
			}

			if (isRevisionMode.value) {
				checkIfLatestRevision();
			}
		}
	},
	{ immediate: true },
);

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
			if (isVersionMode.value && comparisonData.value) {
				// Handle version promotion
				const versionId = (comparisonData.value.selectableDeltas?.[0] as ContentVersion)?.id;

				if (versionId) {
					await api.post(
						`/versions/${versionId}/promote`,
						unref(selectedComparisonFields).length > 0
							? { mainHash: unref(mainHash), fields: unref(selectedComparisonFields) }
							: { mainHash: unref(mainHash) },
					);
				}

				emit('promote', deleteOnPromote);
			} else if (isRevisionMode.value && comparisonData.value) {
				const restoreData: Record<string, any> = {};
				const selectedFields = unref(selectedComparisonFields);

				// Get the delta from the comparison data
				const delta = comparisonData.value.current;
				const base = comparisonData.value.main;

				for (const [field, newValue] of Object.entries(delta)) {
					if (selectedFields.length > 0 && !selectedFields.includes(field)) continue;
					const previousValue = base[field] ?? null;
					if (isEqual(newValue, previousValue)) continue;
					restoreData[field] = newValue;
				}

				emit('confirm', restoreData);
				emit('cancel');
			}

			confirmDeleteOnPromoteDialogActive.value = false;
		} catch (error) {
			unexpectedError(error);
		} finally {
			promoting.value = false;
		}
	}
}

async function onDeltaSelectionChange(newDeltaId: number) {
	modalLoading.value = true;

	try {
		// Update the comparison data with the new delta
		const newComparisonData: ComparisonData = await normalizeComparisonData(
			String(newDeltaId),
			comparisonData.value?.comparisonType || 'revision',
			comparisonData.value?.currentVersion ? ref(comparisonData.value.currentVersion) : undefined,
			undefined,
			comparisonData.value?.selectableDeltas ? ref(comparisonData.value.selectableDeltas as any) : undefined,
		);

		comparisonData.value = { ...comparisonData.value, ...newComparisonData };

		await Promise.allSettled([fetchUserUpdated(), fetchMainItemUserUpdated()]);

		if (isRevisionMode.value) {
			checkIfLatestRevision();
		}
	} catch (error) {
		unexpectedError(error);
	} finally {
		modalLoading.value = false;
	}
}
</script>

<template>
	<v-dialog :model-value="active" persistent @update:model-value="$emit('cancel')" @esc="$emit('cancel')">
		<div class="comparison-modal">
			<div class="scrollable-container">
				<div class="columns vertical-divider">
					<div class="col left">
						<comparison-header
							:loading="modalLoading"
							:title="baseDisplayName"
							:date-updated="normalizedData?.current.date.dateObject || null"
							:user-updated="mainItemUserUpdated"
							:user-loading="mainItemUserLoading"
							:show-latest-chip="isLatestRevision"
						/>
						<div class="comparison-content-divider"></div>
						<div class="comparison-content">
							<template v-if="modalLoading">
								<div class="form-skeleton">
									<v-skeleton-loader type="input" />
									<v-skeleton-loader type="input" />
									<v-skeleton-loader type="input" />
									<v-skeleton-loader type="input" />
								</div>
							</template>
							<template v-else>
								<v-form
									disabled
									:collection="collection"
									:primary-key="primaryKey"
									:initial-values="comparisonData?.main || {}"
									:comparison="
										{
											side: 'current',
											fields: comparisonFields,
											selectedFields: [],
											onToggleField: () => {},
										} as ComparisonContext
									"
									class="comparison-form--main"
								/>
							</template>
						</div>
					</div>
					<div class="comparison-divider"></div>
					<div class="col right">
						<comparison-header
							:loading="modalLoading"
							:title="deltaDisplayName"
							:date-updated="normalizedData?.incoming.date.dateObject || null"
							:user-updated="userUpdated"
							:user-loading="userLoading"
							:show-delta-dropdown="isRevisionMode"
							:comparison-data="comparisonData"
							@delta-change="onDeltaSelectionChange"
						/>
						<div class="comparison-content-divider"></div>
						<div class="comparison-content">
							<template v-if="modalLoading">
								<div class="form-skeleton">
									<v-skeleton-loader type="input" />
									<v-skeleton-loader type="input" />
									<v-skeleton-loader type="input" />
									<v-skeleton-loader type="input" />
								</div>
							</template>
							<template v-else>
								<v-form
									disabled
									:collection="collection"
									:primary-key="primaryKey"
									:initial-values="comparisonData?.current || {}"
									:comparison="
										{
											side: 'incoming',
											fields: comparisonFields,
											selectedFields: selectedComparisonFields,
											onToggleField: toggleComparisonField,
										} as ComparisonContext
									"
									class="comparison-form--current"
								/>
							</template>
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
						<div class="footer-actions">
							<div class="select-all-container">
								<v-checkbox
									:model-value="allFieldsSelected"
									:indeterminate="someFieldsSelected && !allFieldsSelected"
									@update:model-value="toggleSelectAll"
								>
									{{ t('select_all_changes') }} ({{ selectedComparisonFields.length }}/{{ availableFieldsCount }})
								</v-checkbox>
							</div>
							<div class="buttons-container">
								<v-button secondary @click="$emit('cancel')">
									<v-icon name="close" left />
									<span class="button-text">{{ t('cancel') }}</span>
								</v-button>
								<v-button
									v-tooltip.bottom="
										selectedComparisonFields.length === 0
											? isVersionMode
												? t('promote_version_disabled')
												: t('revision_delta_promote_disabled')
											: isVersionMode
												? t('promote_version')
												: t('revision_delta_promote')
									"
									:disabled="selectedComparisonFields.length === 0"
									:loading="promoting"
									@click="onPromoteClick"
								>
									<v-icon :name="'arrow_upload_progress'" left />
									<span class="button-text">
										{{ isVersionMode ? t('promote_version') : t('revision_delta_promote') }}
									</span>
								</v-button>
							</div>
						</div>
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
					{{ t('delete_on_promote_copy', { version: deltaDisplayName }) }}
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
.comparison-modal {
	--comparison-modal-height: max(100% - 8vw, 100% - 120px);
	--comparison-modal-width: max(100% - 8vw, 100% - 120px);
	--comparison-modal-padding-x: 28px;
	--comparison-modal-padding-y: 20px;
	--comparison-modal-border-radius: var(--theme--border-radius);
	--scrollbar-offset: 8px;
	--comparison-modal-peek-width: calc(5px);
	--vertical-divider-width: 2px;
	--vertical-divider-color: var(--theme--border-color-accent);
	--vertical-divider-dash-length: 4px;
	--comparison-field-min-width: 262px;
	--comparison-row-min-width: 556px;
	--comparison-breakpoint-large: 1330px;
	--comparison-breakpoint-small: 706px;

	background: var(--theme--background);
	border-radius: var(--comparison-modal-border-radius);
	box-shadow: var(--theme--shadow);
	display: flex;
	flex-direction: column;
	block-size: var(--comparison-modal-height);
	inline-size: var(--comparison-modal-width);
	overflow: hidden;

	@media (min-width: 960px) {
		--comparison-modal-peek-width: 0;
	}

	.scrollable-container {
		flex: 1 1 auto;
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--theme--border-color-subdued) transparent;
		position: relative;
		scroll-snap-type: x proximity;
		scroll-behavior: smooth;

		@media (min-width: 960px) {
			overflow: hidden auto;
			scroll-snap-type: none;
		}
	}

	.comparison-content-divider {
		border-block-start: 2px solid var(--theme--border-color-subdued);
	}

	.columns {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		min-block-size: 100%;
		position: relative;

		@media (min-width: 960px) {
			min-inline-size: 100%;
		}
	}

	.vertical-divider::after {
		content: '';
		position: absolute;
		inset-block: 0;
		inset-inline-start: calc(var(--comparison-modal-width) - var(--comparison-modal-peek-width));
		inline-size: var(--vertical-divider-width);
		background: repeating-linear-gradient(
			to bottom,
			var(--vertical-divider-color) 0 var(--vertical-divider-dash-length),
			transparent var(--vertical-divider-dash-length) calc(var(--vertical-divider-dash-length) * 2)
		);
		pointer-events: none;

		@media (min-width: 960px) {
			inset-inline-start: 50%;
		}
	}

	.col {
		flex: 0 0 auto;
		min-inline-size: 0;
		scroll-snap-align: start;
		scroll-snap-stop: always;
		inline-size: calc(var(--comparison-modal-width) - var(--comparison-modal-peek-width));

		@media (min-width: 960px) {
			flex: 0 0 50%;
			inline-size: auto;
			scroll-snap-align: none;
			scroll-snap-stop: normal;
		}
	}

	.comparison-content {
		padding: var(--comparison-modal-padding-x);
	}

	.comparison-divider {
		display: none;

		@media (min-width: 960px) {
			display: block;
			border-inline-end: 2px dashed var(--theme--border-color-subdued);
			background: var(--theme--background);
		}
	}

	.footer {
		flex: 0 0 auto;
		justify-content: space-between;
		padding-inline: var(--comparison-modal-padding-x);
		padding-block: var(--comparison-modal-padding-y);
		border-block-start: 2px solid var(--theme--border-color-subdued);

		.columns {
			flex-direction: row;
		}

		.col {
			flex: 1 1 auto;
			min-inline-size: 0;

			&.left {
				display: none;

				@media (min-width: 960px) {
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
			}

			&.right {
				display: flex;
				justify-content: center;
				flex-direction: column;
				gap: 16px;

				@media (min-width: 960px) {
					flex: 1;
					justify-content: flex-end;
					align-items: end;
				}

				.select-all-container {
					display: flex;
					min-inline-size: auto;
					flex: 1 1 100%;
					text-align: center;
					margin-block-end: 12px;

					@media (min-width: 960px) {
						flex: 1 1 auto;
						flex-shrink: 0;
						margin-block-end: 0;
					}
				}

				.footer-actions {
					@media (min-width: 960px) {
						display: flex;
						align-items: center;
						gap: 24px;
					}
				}

				.buttons-container {
					flex: 1 1 100%;
					display: flex;
					gap: 12px;

					.button-text {
						display: none;

						@media (min-width: 960px) {
							display: inline;
						}
					}
				}

				.v-button {
					flex: 1;

					:deep(.button) {
						inline-size: 100%;
					}

					.v-button-content span {
						display: none;
					}

					.v-icon {
						margin: 0;

						@media (min-width: 960px) {
							margin-inline-end: 8px;
						}
					}
				}
			}
		}

		@media (min-width: 960px) {
			.columns {
				gap: 0;
			}
		}
	}
}

/* Override form grid behavior for comparison modal */
.comparison-content {
	:deep(.v-form) {
		display: grid;
		align-items: start;
		grid-template-columns: [start] minmax(0, 1fr) [half] minmax(0, 1fr) [full];
		gap: var(--theme--form--row-gap) var(--theme--form--column-gap);

		@media (max-width: var(--comparison-breakpoint-large)) {
			.half,
			.half-left,
			.half-space {
				grid-column: start / full;
			}

			.half + .half,
			.half-right {
				grid-column: start / full;
			}
		}

		@media (max-width: var(--comparison-breakpoint-small)) {
			grid-template-columns: [start] minmax(var(--comparison-field-min-width), 1fr) [full];

			.half,
			.half-left,
			.half-space,
			.half + .half,
			.half-right {
				grid-column: start / full;
			}
		}

		.field {
			grid-column: start / full;
		}
	}
}
</style>

<style lang="scss" scoped>
.form-skeleton {
	display: grid;
	align-items: start;
	grid-template-columns: 1fr;
	gap: var(--theme--form--row-gap) var(--theme--form--column-gap);
	padding: var(--comparison-modal-padding-x);
}

.comparison-form--main {
	--comparison-indicator--color: var(--theme--danger);
}

.comparison-form--current {
	--comparison-indicator--color: var(--theme--success);
}
</style>
