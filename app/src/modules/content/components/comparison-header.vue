<script setup lang="ts">
import { userName } from '@/utils/user-name';
import { localizedFormat } from '@/utils/localized-format';
import { User } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	title: string;
	dateUpdated: Date | null;
	userUpdated: User | null;
	userLoading: boolean;
	showDeltaDropdown?: boolean;
	comparisonData?: any;
	showLatestChip?: boolean;
	loading?: boolean;
}

const { t } = useI18n();

const props = defineProps<Props>();

const emit = defineEmits<{
	(e: 'delta-change', value: number): void;
}>();

const userUpdatedName = computed(() => {
	if (!props.userUpdated) return null;
	return userName(props.userUpdated);
});

const deltaOptions = computed(() => {
	if (!props.showDeltaDropdown || !props.comparisonData?.selectableDeltas) return [];

	const deltas = props.comparisonData.selectableDeltas;
	return deltas.map((delta: any) => {
		if (delta.activity?.timestamp) {
			const date = localizedFormat(new Date(delta.activity.timestamp), String(t('date-fns_date_short')));
			const time = localizedFormat(new Date(delta.activity.timestamp), String(t('date-fns_time')));
			const formattedDate = `${date} (${time})`;

			let user = t('private_user');

			if (typeof delta.activity.user === 'object') {
				user = userName(delta.activity.user);
			}

			return {
				text: `${formattedDate} - ${user}`,
				value: delta.id,
			};
		}

		return {
			text: delta.name || delta.key || `Item ${delta.id}`,
			value: delta.id,
		};
	});
});

const selectedDeltaId = computed(() => {
	if (!props.showDeltaDropdown || !props.comparisonData) return null;

	return props.comparisonData.initialSelectedDeltaId || null;
});

const selectedOption = computed(() => {
	if (!selectedDeltaId.value) return null;
	return deltaOptions.value.find((option: any) => option.value === selectedDeltaId.value);
});
</script>

<template>
	<div class="comparison-header">
		<div class="header-content">
			<div class="title-container">
				<v-skeleton-loader v-if="loading" type="text" class="title-skeleton" />

				<template v-else>
					<div class="title">{{ title }}</div>
					<v-chip v-if="showLatestChip" small class="latest-chip">{{ t('latest_version') }}</v-chip>
				</template>
			</div>
		</div>
		<div class="header-meta">
			<v-skeleton-loader v-if="loading" type="text" class="meta-skeleton" />

			<template v-else>
				<div v-if="showDeltaDropdown" class="delta-dropdown">
					<v-menu attached>
						<template #activator="{ toggle }">
							<div class="delta-selection" @click="toggle">
								<div class="delta-content">
									<div class="delta-date-time">{{ selectedOption?.text.split(' - ')[0] }}</div>
									<div class="delta-user-info">{{ t('edited_by') }} {{ selectedOption?.text.split(' - ')[1] }}</div>
								</div>
								<v-icon name="expand_more" class="dropdown-icon" />
							</div>
						</template>
						<v-list>
							<v-list-item
								v-for="option in deltaOptions"
								:key="option.value"
								:active="selectedDeltaId === option.value"
								clickable
								@click="emit('delta-change', option.value)"
							>
								<v-list-item-content>
									<div class="delta-option-content">
										<div class="delta-option-date-time">{{ option.text.split(' - ')[0] }}</div>
										<div class="delta-option-user-info">{{ t('edited_by') }} {{ option.text.split(' - ')[1] }}</div>
									</div>
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</div>
				<div v-else class="meta-info">
					<div v-if="dateUpdated" class="date-time">
						{{ localizedFormat(dateUpdated, String(t('date-fns_date_short'))) }}
						{{ localizedFormat(dateUpdated, String(t('date-fns_time'))) }}
					</div>
					<div v-if="userUpdatedName" class="user-info">{{ t('edited_by') }} {{ userUpdatedName }}</div>
					<div v-else-if="userLoading" class="user-info">
						{{ t('loading') }}
					</div>
					<div v-else class="user-info">{{ t('edited_by') }} {{ t('unknown_user') }}</div>
				</div>
			</template>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.comparison-header {
	display: flex;
	padding-block: var(--comparison-modal-padding-y);
	padding-inline: var(--comparison-modal-padding-x);
	block-size: 140px;

	flex-direction: column;
	align-items: flex-start;
	align-self: stretch;
	gap: 12px;

	@media (min-width: 960px) {
		block-size: 80px;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	.header-content {
		flex: 1;

		.title-container {
			display: flex;
			align-items: center;
			gap: 12px;

			.title {
				font-size: 20px;
				font-weight: 600;
				line-height: 32px;
				color: var(--theme--foreground-accent);
				margin: 0;
			}
		}
	}

	.header-meta {
		flex-shrink: 0;
		min-inline-size: 0;

		.delta-dropdown {
			.delta-selection {
				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: pointer;
				border: 1px solid var(--theme--border-color);
				border-radius: var(--theme--border-radius);
				padding-inline: 16px;
				padding-block: 8px;

				.delta-content {
					text-align: start;

					@media (min-width: 960px) {
						text-align: end;
					}

					.delta-date-time {
						font-size: 14px;
						line-height: 20px;
						font-weight: 600;
					}

					.delta-user-info {
						font-size: 14px;
						line-height: 20px;
						color: var(--theme--foreground-subdued);
					}
				}

				.dropdown-icon {
					color: var(--theme--foreground-subdued);
					margin-inline-start: 4px;
					transition: transform var(--fast) var(--transition);
				}
			}
		}

		.meta-info {
			text-align: start;

			@media (min-width: 960px) {
				text-align: end;
			}

			.date-time {
				font-size: 14px;
				line-height: 20px;
				font-weight: 600;
			}

			.user-info {
				font-size: 14px;
				line-height: 20px;
				color: var(--theme--foreground-subdued);
			}
		}
	}

	.title-skeleton {
		block-size: 40px;
		inline-size: 120px;
	}

	.meta-skeleton {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: start;

		@media (min-width: 960px) {
			text-align: end;
		}

		.date-skeleton {
			block-size: 40px;
			inline-size: 200px;
		}
	}
}
</style>
