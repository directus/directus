<script setup lang="ts">
import { User } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VMenu from '@/components/v-menu.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { localizedFormat } from '@/utils/localized-format';
import { userName } from '@/utils/user-name';

interface Props {
	title: string;
	dateUpdated: Date | string | null;
	userUpdated: User | null;
	userLoading: boolean;
	showDeltaDropdown?: boolean;
	comparisonData?: any;
	loading?: boolean;
	tooltipMessage?: string;
}

const { t } = useI18n();

const props = defineProps<Props>();

const emit = defineEmits<{
	(e: 'delta-change', value: string | number): void;
}>();

const userUpdatedName = computed(() => {
	if (!props.userUpdated?.first_name && !props.userUpdated?.last_name && !props.userUpdated?.email) {
		return t('unknown_user');
	}

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

const selectOptionTime = computed(() => getDelataOptionTime(selectedOption.value));

const selectOptionUser = computed(() => getDeltaOptionUser(selectedOption.value));

function getDelataOptionTime(deltaOption: any) {
	if (!deltaOption) return null;
	return deltaOption.text.split(' - ')[0] || null;
}

function getDeltaOptionUser(deltaOption: any) {
	if (!deltaOption) return null;
	return deltaOption.text.split(' - ')[1] || null;
}
</script>

<template>
	<div class="comparison-header" :class="{ 'has-dropdown': showDeltaDropdown }">
		<div class="title-container">
			<VSkeletonLoader v-if="loading" type="text" class="title-skeleton" />

			<template v-else>
				<VTextOverflow :text="title" class="title" />
				<VIcon v-if="tooltipMessage" v-tooltip.bottom="tooltipMessage" name="error" class="icon" />
			</template>
		</div>
		<div class="header-meta">
			<VSkeletonLoader v-if="loading" type="text" class="meta-skeleton" />

			<template v-else>
				<div class="meta-content">
					<VMenu v-if="showDeltaDropdown" attached>
						<template #activator="{ toggle }">
							<button class="meta-selection" @click="toggle">
								<div class="meta-text">
									<div class="meta-date-time">{{ selectOptionTime }}</div>
									<div class="meta-user-info">{{ $t('edited_by') }} {{ selectOptionUser }}</div>
								</div>
								<VIcon name="expand_more" class="dropdown-icon" />
							</button>
						</template>

						<VListItem
							v-for="option in deltaOptions"
							:key="option.value"
							:active="selectedDeltaId === option.value"
							class="meta-selection-option"
							clickable
							@click="emit('delta-change', option.value)"
						>
							<div>
								<div>{{ getDelataOptionTime(option) }}</div>
								<div>{{ $t('edited_by') }} {{ getDeltaOptionUser(option) }}</div>
							</div>
						</VListItem>
					</VMenu>

					<div v-else class="meta-text">
						<div v-if="formattedDateUpdated" class="meta-date-time">
							{{ formattedDateUpdated }}
						</div>
						<div v-if="userUpdatedName" class="meta-user-info">{{ $t('edited_by') }} {{ userUpdatedName }}</div>
						<div v-else-if="userLoading" class="meta-user-info">
							{{ $t('loading') }}
						</div>
						<div v-else class="meta-user-info">{{ $t('edited_by') }} {{ $t('unknown_user') }}</div>
					</div>
				</div>
			</template>
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
	block-size: 144px;
	flex-direction: column;
	align-items: flex-start;
	align-self: stretch;
	gap: 12px var(--theme--form--column-gap);

	@media (min-width: 960px) {
		block-size: 80px;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.title-container,
	.header-meta {
		inline-size: 100%;
		min-inline-size: 0;

		@media (min-width: 960px) {
			inline-size: auto;
		}
	}

	&.has-dropdown {
		.title-container,
		.header-meta {
			@media (min-width: 1330px) {
				inline-size: calc(50% - var(--theme--form--column-gap) / 2);
			}
		}
	}

	.title-container {
		display: flex;
		align-items: center;
		gap: 8px;

		.title {
			font-size: 20px;
			font-weight: 600;
			line-height: 32px;
			color: var(--theme--foreground-accent);
			margin: 0;
		}

		.v-icon {
			color: var(--theme--foreground-subdued);

			&:hover {
				color: var(--theme--warning);
			}
		}
	}

	.header-meta {
		flex-shrink: 0;

		.meta-content {
			.meta-text {
				padding-block-start: 10px;
				text-align: start;

				@media (min-width: 960px) {
					padding-block-start: 0;
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
				inline-size: 100%;

				@media (min-width: 960px) {
					inline-size: auto;

					.meta-text {
						text-align: start;
					}
				}

				@media (min-width: 1330px) {
					inline-size: 100%;
				}

				&:hover {
					border-color: var(--theme--border-color-accent);
				}

				.meta-text {
					padding-block-start: 0;
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

.meta-selection-option {
	--v-list-item-padding: 4px 12px;
}
</style>
