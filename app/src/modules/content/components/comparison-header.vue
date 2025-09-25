<script setup lang="ts">
import { userName } from '@/utils/user-name';
import { localizedFormat } from '@/utils/localized-format';
import { User } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	title: string;
	dateUpdated: Date | string | null;
	userUpdated: User | null;
	userLoading: boolean;
	showDeltaDropdown?: boolean;
	comparisonData?: any;
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

const formatDateTime = (date: Date) => {
	const dateStr = localizedFormat(date, String(t('date-fns_date_short_no_year')));
	const timeStr = localizedFormat(date, String(t('date-fns_time')));
	return `${dateStr} ${timeStr}`;
};

const formattedDateUpdated = computed(() => {
	if (!props.dateUpdated) return null;
	if (typeof props.dateUpdated === 'string') return props.dateUpdated;
	return formatDateTime(props.dateUpdated);
});

const deltaOptions = computed(() => {
	if (!props.showDeltaDropdown || !props.comparisonData?.selectableDeltas) return [];

	const deltas = props.comparisonData.selectableDeltas;
	return deltas.map((delta: any) => {
		if (delta.activity?.timestamp) {
			const formattedDate = formatDateTime(new Date(delta.activity.timestamp));

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

				<v-text-overflow v-else :text="title" class="title" />
			</div>
			<div class="header-meta">
				<v-skeleton-loader v-if="loading" type="text" class="meta-skeleton" />

				<template v-else>
					<div class="meta-content">
						<v-menu v-if="showDeltaDropdown" attached>
							<template #activator="{ toggle }">
								<button class="meta-selection" @click="toggle">
									<div class="meta-text">
										<div class="meta-date-time">{{ selectedOption?.text.split(' - ')[0] }}</div>
										<div class="meta-user-info">{{ t('edited_by') }} {{ selectedOption?.text.split(' - ')[1] }}</div>
									</div>
									<v-icon name="expand_more" class="dropdown-icon" />
								</button>
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
						<div v-else class="meta-text">
							<div v-if="formattedDateUpdated" class="meta-date-time">
								{{ formattedDateUpdated }}
							</div>
							<div v-if="userUpdatedName" class="meta-user-info">{{ t('edited_by') }} {{ userUpdatedName }}</div>
							<div v-else-if="userLoading" class="meta-user-info">
								{{ t('loading') }}
							</div>
							<div v-else class="meta-user-info">{{ t('edited_by') }} {{ t('unknown_user') }}</div>
						</div>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.comparison-header {
	--comparison-header--padding-y: 20px;
	--comparison-header--padding-x: var(--comparison-modal--padding-x, 28px);

	display: flex;
	padding-block: var(--comparison-header--padding-y);
	padding-inline: var(--comparison-header--padding-x);
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex: 1;
		inline-size: 100%;

		.title-container {
			display: flex;
			align-items: center;
			gap: 12px;
			inline-size: 60%;

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

		.meta-content {
			.meta-text {
				text-align: start;

				@media (min-width: 960px) {
					text-align: end;
				}

				.meta-date-time {
					font-size: 14px;
					line-height: 20px;
					font-weight: 600;
				}

				.meta-user-info {
					font-size: 14px;
					line-height: 20px;
					color: var(--theme--foreground-subdued);
				}
			}

			.meta-selection {
				--focus-ring-offset: var(--focus-ring-offset-invert);

				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: pointer;
				border: 2px solid var(--theme--border-color);
				border-radius: var(--theme--border-radius);
				padding-inline: 16px;
				padding-block: 8px;

				@media (min-width: 960px) {
					.meta-text {
						text-align: start;
					}
				}

				&:hover {
					border-color: var(--theme--border-color-accent);
				}

				.dropdown-icon {
					color: var(--theme--foreground-subdued);
					margin-inline-start: 4px;
					transition: transform var(--fast) var(--transition);
				}
			}
		}
	}

	.title-skeleton {
		block-size: 40px;
		min-inline-size: 120px;
	}

	.meta-skeleton {
		block-size: 40px;
		min-inline-size: 200px;
	}
}
</style>
