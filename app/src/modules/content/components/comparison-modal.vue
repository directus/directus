<script setup lang="ts">
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ContentVersion } from '@directus/types';
import { ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ComparisonHeader from './comparison-header.vue';
import type { ComparisonContext } from '@/components/v-form/types';
import { useComparison } from '../composables/use-comparison';

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

const props = defineProps<Props>();

const { active, currentVersion, deleteVersionsAllowed } = toRefs(props);

const {
	selectedComparisonFields,
	comparedData,
	userUpdated,
	mainItemUserUpdated,
	currentVersionDisplayName,
	mainHash,
	versionDateUpdated,
	mainItemDateUpdated,
	allFieldsSelected,
	someFieldsSelected,
	availableFieldsCount,
	comparisonFields,
	getFieldsWithDifferences,
	toggleSelectAll,
	toggleComparisonField,
} = useComparison(currentVersion);

const loading = ref(false);
const userLoading = ref(false);
const mainItemUserLoading = ref(false);

const { confirmDeleteOnPromoteDialogActive, onPromoteClick, promoting, promote } = usePromoteDialog();

const emit = defineEmits<{
	cancel: [];
	promote: [deleteOnPromote: boolean];
}>();

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

async function getComparison() {
	loading.value = true;

	try {
		const result: Comparison = await api
			.get(`/versions/${unref(currentVersion).id}/compare`)
			.then((res) => res.data.data);

		comparedData.value = result;

		selectedComparisonFields.value = getFieldsWithDifferences(result);

		await fetchMainItemUserUpdated();
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

async function fetchUserUpdated() {
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
								:comparison="
									{
										mode: !!comparedData,
										side: 'main',
										fields: comparisonFields,
									} as ComparisonContext
								"
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
								:initial-values="comparedData?.current || {}"
								:comparison="
									{
										mode: !!comparedData,
										side: 'version',
										fields: comparisonFields,
										selectedFields: selectedComparisonFields,
										onToggleField: toggleComparisonField,
									} as ComparisonContext
								"
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
										selectedComparisonFields.length === 0 ? t('promote_version_disabled') : t('promote_version')
									"
									:disabled="selectedComparisonFields.length === 0"
									:loading="promoting"
									@click="onPromoteClick"
								>
									<v-icon name="arrow_upload_progress" left />
									<span class="button-text">{{ t('promote_version') }}</span>
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
	--comparison-modal-height: 90vh;
	--comparison-modal-width: 90vw;
	--comparison-modal-padding-x: 28px;
	--comparison-modal-padding-y: 20px;
	--comparison-modal-border-radius: var(--theme--border-radius);
	--scrollbar-offset: 8px;
	--comparison-modal-peek-width: calc(25px + var(--scrollbar-offset));
	--vertical-divider-width: 2px;
	--vertical-divider-color: var(--theme--border-color-accent);
	--vertical-divider-dash-length: 4px;

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
</style>
