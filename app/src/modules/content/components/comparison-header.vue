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
}

const { t } = useI18n();

const props = defineProps<Props>();

const userUpdatedName = computed(() => {
	if (!props.userUpdated) return null;
	return userName(props.userUpdated);
});
</script>

<template>
	<div class="comparison-header">
		<div class="header-content">
			<h3>{{ title }}</h3>
		</div>
		<div class="header-meta">
			<div class="meta-info">
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
		</div>
	</div>
</template>

<style lang="scss" scoped>
.comparison-header {
	display: flex;
	padding-block: var(--comparison-modal-padding-y);
	padding-inline: var(--comparison-modal-padding-x);

	flex-direction: column;
	align-items: flex-start;
	align-self: stretch;
	gap: 12px;

	@media (min-width: 960px) {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

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
			text-align: start;

			@media (min-width: 960px) {
				text-align: end;
			}

			.date-time {
				font-size: 14px;
				font-weight: 500;
				line-height: 20px;
				color: var(--theme--foreground);

				margin-block-end: 0;

				@media (min-width: 960px) {
					margin-block-end: 4px;
				}
			}

			.user-info {
				font-size: 14px;
				line-height: 20px;
				color: var(--theme--foreground-subdued);
			}
		}
	}
}
</style>
