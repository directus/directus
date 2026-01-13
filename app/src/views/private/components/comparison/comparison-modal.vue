<script setup lang="ts">
import type { ContentVersion, Item, PrimaryKey } from '@directus/types';
import { isEqual } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ComparisonHeader from './comparison-header.vue';
import { useComparison } from './use-comparison';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import type { Revision } from '@/types/revisions';
import { translateShortcut } from '@/utils/translate-shortcut';
import { unexpectedError } from '@/utils/unexpected-error';
import { CollabContext } from '@/composables/use-collab';

interface Props {
	deleteVersionsAllowed: boolean;
	collection: string;
	primaryKey: PrimaryKey;
	mode: 'version' | 'revision' | 'collab';
	currentVersion: ContentVersion | null | undefined;
	currentCollab: { from: Item; to: Item } | undefined;
	revisions?: Revision[] | null;
	collabContext?: CollabContext;
}

const props = defineProps<Props>();
const active = defineModel<boolean>();
const currentRevision = defineModel<Revision | null>('current-revision');

const emit = defineEmits<{
	cancel: [];
	promote: [deleteOnPromote: boolean];
	confirm: [data: Record<string, any>];
}>();

const { t } = useI18n();

const { deleteVersionsAllowed, collection, primaryKey, mode, currentVersion, revisions, currentCollab } = toRefs(props);

const {
	comparisonData,
	selectedComparisonFields,
	userUpdated,
	baseUserUpdated,
	mainHash,
	allFieldsSelected,
	someFieldsSelected,
	availableFieldsCount,
	comparisonFields,
	userLoading,
	baseUserLoading,
	baseDisplayName,
	deltaDisplayName,
	normalizedData,
	toggleSelectAll,
	toggleComparisonField,
	fetchComparisonData,
	fetchUserUpdated,
	fetchBaseItemUserUpdated,
} = useComparison({
	collection,
	primaryKey,
	mode,
	currentVersion,
	currentRevision,
	revisions,
	currentCollab,
});

const incomingTooltipMessage = computed(() => {
	if (props.mode === 'revision') return `${t('changes_made')} ${t('no_relational_data')}`;
	if (comparisonData.value?.outdated) return t('main_updated_notice');
	return undefined;
});

const { confirmDeleteOnPromoteDialogActive, onPromoteClick, promoting, promote } = usePromoteDialog();

const modalLoading = ref(false);

watch(
	[active, currentRevision],
	async ([isActive]) => {
		if (!isActive) return;

		modalLoading.value = true;

		try {
			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();
		} finally {
			modalLoading.value = false;
		}
	},
	{ immediate: true },
);

if (mode.value === 'collab') {
	watch(
		[currentCollab],
		async () => {
			if (!active.value) return;

			await fetchComparisonData();
		},
		{ immediate: true },
	);
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
			if (props.mode === 'version') {
				// Handle version promotion
				const versionId = (comparisonData.value!.selectableDeltas?.[0] as ContentVersion)?.id;

				if (versionId) {
					await api.post(
						`/versions/${versionId}/promote`,
						unref(selectedComparisonFields).length > 0
							? { mainHash: unref(mainHash), fields: unref(selectedComparisonFields) }
							: { mainHash: unref(mainHash) },
					);
				}

				emit('promote', deleteOnPromote);
			} else {
				const restoreData: Record<string, any> = {};
				const selectedFields = unref(selectedComparisonFields);

				// Get the delta from the comparison data
				const delta = comparisonData.value!.incoming;
				const base = comparisonData.value!.base;

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

function onIncomingSelectionChange(newDeltaId: PrimaryKey) {
	if (props.mode !== 'revision') return;

	currentRevision.value = revisions.value?.find((revision) => revision.id === newDeltaId) ?? null;
}
</script>

<template>
	<VDialog
		:model-value="active"
		persistent
		keep-behind
		@update:model-value="$emit('cancel')"
		@esc="$emit('cancel')"
		@apply="onPromoteClick"
	>
		<div class="comparison-modal">
			<div class="scrollable-container">
				<div class="columns">
					<div class="col left">
						<ComparisonHeader
							:loading="modalLoading"
							:mode="mode"
							:title="baseDisplayName"
							:subtitle="mode === 'collab' ? $t('collab_collision') : undefined"
							:date-updated="$t('latest')"
							:user-updated="baseUserUpdated"
							:user-loading="baseUserLoading"
						/>
						<div class="comparison-content-divider"></div>
						<div class="comparison-content">
							<template v-if="modalLoading">
								<div class="form-skeleton">
									<VSkeletonLoader type="input" />
									<VSkeletonLoader type="input" />
									<VSkeletonLoader type="input" />
									<VSkeletonLoader type="input" />
								</div>
							</template>
							<template v-else>
								<VForm
									:collection="collection"
									:primary-key="primaryKey"
									:initial-values="comparisonData?.base || {}"
									:collab-context="collabContext"
									:comparison="{
										side: 'base',
										fields: comparisonFields,
										revisionFields: comparisonData?.revisionFields,
										selectedFields: [],
										onToggleField: () => {},
									}"
									non-editable
									class="comparison-form--base"
								/>
							</template>
						</div>
					</div>

					<div class="col right vertical-divider">
						<ComparisonHeader
							:loading="modalLoading"
							:mode="mode"
							:title="deltaDisplayName"
							:date-updated="normalizedData?.incoming.date.dateObject || null"
							:user-updated="userUpdated"
							:user-loading="userLoading"
							:show-delta-dropdown="mode === 'revision'"
							:comparison-data="comparisonData"
							:tooltip-message="incomingTooltipMessage"
							@delta-change="onIncomingSelectionChange"
						/>
						<div class="comparison-content-divider"></div>
						<div class="comparison-content">
							<template v-if="modalLoading">
								<div class="form-skeleton">
									<VSkeletonLoader type="input" />
									<VSkeletonLoader type="input" />
									<VSkeletonLoader type="input" />
									<VSkeletonLoader type="input" />
								</div>
							</template>
							<template v-else>
								<VForm
									:collection="collection"
									:primary-key="primaryKey"
									:initial-values="comparisonData?.incoming || {}"
									:comparison="{
										side: 'incoming',
										fields: comparisonFields,
										revisionFields: comparisonData?.revisionFields,
										selectedFields: selectedComparisonFields,
										onToggleField: toggleComparisonField,
									}"
									non-editable
									class="comparison-form--incoming"
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
							{{ $t('differences_count', { count: availableFieldsCount }) }}
						</div>
					</div>
					<div class="col right">
						<div class="footer-actions">
							<div class="select-all-container">
								<VCheckbox
									v-if="availableFieldsCount > 0"
									:model-value="allFieldsSelected"
									:indeterminate="someFieldsSelected && !allFieldsSelected"
									@update:model-value="toggleSelectAll"
								>
									{{ $t('select_all_differences') }} ({{ selectedComparisonFields.length }}/{{ availableFieldsCount }})
								</VCheckbox>
							</div>
							<div class="buttons-container">
								<VButton
									v-tooltip.top="`${$t('cancel')} (${translateShortcut(['esc'])})`"
									secondary
									@click="$emit('cancel')"
								>
									<VIcon name="close" left />
									<span class="button-text">{{ $t(mode === 'collab' ? 'discard' : 'cancel') }}</span>
								</VButton>
								<VButton
									v-tooltip.top="
										selectedComparisonFields.length === 0
											? undefined
											: `${$t('apply')} (${translateShortcut(['meta', 'enter'])})`
									"
									:disabled="selectedComparisonFields.length === 0"
									:loading="promoting"
									@click="onPromoteClick"
								>
									<VIcon :name="'arrow_upload_progress'" left />
									<span class="button-text">
										{{ $t('apply') }}
									</span>
								</VButton>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<VDialog
			v-model="confirmDeleteOnPromoteDialogActive"
			@esc="confirmDeleteOnPromoteDialogActive = false"
			@apply="promote(true)"
		>
			<VCard>
				<VCardTitle>
					{{ $t('delete_on_apply_copy', { version: deltaDisplayName }) }}
				</VCardTitle>
				<VCardActions>
					<VButton secondary @click="promote(false)">{{ $t('keep') }}</VButton>
					<VButton :loading="promoting" kind="danger" @click="promote(true)">
						{{ $t('delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</VDialog>
</template>

<style lang="scss" scoped>
.comparison-modal {
	--header-bar-height: 60px;
	--comparison-modal--width: max(100% - 8vw, 100% - var(--header-bar-height) * 2);
	--comparison-modal--height: var(--comparison-modal--width);
	--comparison-modal--padding-x: 28px;
	--comparison-modal--padding-y: 20px;
	--comparison-modal--border-radius: var(--theme--border-radius);
	--comparison-modal--peek-width: calc(5px);
	--comparison-modal--divider-width: var(--theme--border-width, 2px);
	--comparison-modal--divider-color: var(--theme--border-color-accent);
	--comparison-modal--divider-dash: calc(var(--comparison-modal--divider-width) * 2);

	background: var(--theme--background);
	border-radius: var(--comparison-modal--border-radius);
	box-shadow: var(--theme--shadow);
	display: flex;
	flex-direction: column;
	block-size: var(--comparison-modal--height);
	inline-size: var(--comparison-modal--width);
	overflow: hidden;

	@media (min-width: 706px) {
		--comparison-modal--peek-width: 0;
	}

	.scrollable-container {
		flex: 1 1 auto;
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--theme--border-color-subdued) transparent;
		position: relative;
		scroll-snap-type: x proximity;
		scroll-behavior: smooth;

		@media (min-width: 706px) {
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

		@media (min-width: 706px) {
			min-inline-size: 100%;
		}
	}

	.col {
		flex: 0 0 auto;
		min-inline-size: 0;
		scroll-snap-align: start;
		scroll-snap-stop: always;
		inline-size: calc(var(--comparison-modal--width) - var(--comparison-modal--peek-width));

		@media (min-width: 544px) {
			flex: 0 0 66%;
			inline-size: auto;
		}

		@media (min-width: 706px) {
			flex: 0 0 50%;
			inline-size: auto;
			scroll-snap-align: none;
			scroll-snap-stop: normal;
		}
	}

	.comparison-content {
		padding: var(--comparison-modal--padding-x);
	}

	.vertical-divider {
		position: relative;

		&::after {
			content: '';
			position: absolute;
			inset-block: 0;
			inset-inline-start: calc(-1 * (var(--comparison-modal--divider-width) / 2));
			inline-size: var(--comparison-modal--divider-width);
			background: repeating-linear-gradient(
				to bottom,
				var(--comparison-modal--divider-color) 0 var(--comparison-modal--divider-dash),
				transparent var(--comparison-modal--divider-dash) calc(var(--comparison-modal--divider-dash) * 2)
			);
			pointer-events: none;
		}
	}

	.footer {
		flex: 0 0 auto;
		justify-content: space-between;
		padding-inline: var(--comparison-modal--padding-x);
		padding-block: 18px;
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

				@media (min-width: 706px) {
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

					@media (min-width: 706px) {
						flex: 1 1 auto;
						flex-shrink: 0;
						margin-block-end: 0;
					}
				}

				.footer-actions {
					@media (min-width: 706px) {
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

						@media (min-width: 544px) {
							display: inline;
						}
					}
				}

				.v-button {
					--v-button-min-width: 0;

					flex: 1;

					:deep(.button) {
						inline-size: 100%;
					}

					.v-button-content span {
						display: none;
					}

					.v-icon {
						margin: 0;

						@media (min-width: 544px) {
							margin-inline-end: 8px;
						}
					}

					@media (min-width: 544px) {
						--v-button-min-width: 140px;
					}
				}
			}
		}

		@media (min-width: 706px) {
			.columns {
				gap: 0;
			}
		}
	}
}

.comparison-content {
	:deep(.v-form) {
		align-items: start;

		.fill {
			grid-column: start / full;
		}

		@media (max-width: 1330px) {
			.fill,
			.full,
			.half,
			.half + .half,
			.half-left,
			.half-right,
			.half-space {
				grid-column: start / fill;
			}
		}
	}
}

.select-all-container {
	:deep(.v-checkbox .type-text) {
		font-weight: 600;
	}
}

.form-skeleton {
	display: grid;
	align-items: start;
	grid-template-columns: 1fr;
	gap: var(--theme--form--row-gap) var(--theme--form--column-gap);
}

.comparison-form--base {
	--field-indicator--color-active: var(--theme--danger);
	--field-indicator--color-muted: var(--theme--danger-background);
}

.comparison-form--incoming {
	--field-indicator--color-active: var(--theme--success);
	--field-indicator--color-muted: var(--theme--success-background);
}
</style>
