<script setup lang="ts">
import { isAllowed } from '@/utils/is-allowed';
import { Share } from '@directus/types';
import { format } from 'date-fns';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	share: Share;
}>();

defineEmits<{
	(e: 'copy'): void;
	(e: 'edit'): void;
	(e: 'invite'): void;
	(e: 'delete'): void;
}>();

const { t } = useI18n();

const editAllowed = computed(() => {
	return isAllowed('directus_shares', 'update', props.share);
});

const deleteAllowed = computed(() => {
	return isAllowed('directus_shares', 'delete', props.share);
});

const usesLeft = computed(() => {
	if (props.share.max_uses === null) return null;
	return props.share.max_uses - props.share.times_used;
});

const status = computed(() => {
	if (props.share.date_end && new Date(props.share.date_end) < new Date()) {
		return 'expired';
	}

	if (props.share.date_start && new Date(props.share.date_start) > new Date()) {
		return 'upcoming';
	}

	return null;
});

const formattedTime = computed(() => {
	return format(new Date(props.share.date_created), String(t('date-fns_date_short')));
});
</script>

<template>
	<div class="item">
		<div class="item-header">
			<span class="type-label">{{ share.name }}</span>

			<div class="header-right">
				<v-menu show-arrow placement="bottom-end">
					<template #activator="{ toggle, active }">
						<v-icon class="more" :class="{ active }" name="more_horiz" clickable @click="toggle" />
						<div class="date">
							{{ formattedTime }}
						</div>
					</template>

					<v-list>
						<v-list-item clickable @click="$emit('copy')">
							<v-list-item-icon><v-icon name="content_copy" /></v-list-item-icon>
							<v-list-item-content>{{ t('share_copy_link') }}</v-list-item-content>
						</v-list-item>
						<v-list-item clickable @click="$emit('invite')">
							<v-list-item-icon><v-icon name="send" /></v-list-item-icon>
							<v-list-item-content>{{ t('share_send_link') }}</v-list-item-content>
						</v-list-item>
						<v-divider v-if="deleteAllowed && editAllowed" />
						<v-list-item v-if="editAllowed" clickable @click="$emit('edit')">
							<v-list-item-icon><v-icon name="edit" /></v-list-item-icon>
							<v-list-item-content>{{ t('edit') }}</v-list-item-content>
						</v-list-item>
						<v-list-item v-if="deleteAllowed" clickable class="danger" @click="$emit('delete')">
							<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
							<v-list-item-content>{{ t('delete_label') }}</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>
		</div>

		<div class="item-info">
			<span class="share-uses" :class="{ 'no-left': usesLeft === 0 }">
				<template v-if="usesLeft === null">{{ t('unlimited_usage') }}</template>
				<template v-else>{{ t('uses_left', usesLeft) }}</template>
			</span>
			<v-icon v-if="share.password" small name="lock" />
			<span style="flex-grow: 1"></span>
			<span v-if="status" class="share-status" :class="{ [status]: true }">
				{{ t(status) }}
			</span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.item {
	margin-bottom: 8px;
	padding: 8px;
	background-color: var(--theme--background);
	border-radius: var(--border-radius);
}

.item-date {
	color: var(--theme--foreground-subdued);
	font-size: 12px;
}

.item-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 0;
}

.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}

.item-info {
	display: flex;
	align-items: center;
	color: var(--theme--foreground-subdued);
}

.share-uses {
	margin-right: 5px;
	font-size: 12px;

	&.no-left {
		color: var(--theme--danger);
	}
}

.share-status {
	font-weight: 600;
	font-size: 12px;
	text-align: end;
	text-transform: uppercase;

	&.expired {
		color: var(--theme--warning);
	}

	&.upcoming {
		color: var(--green);
	}
}

.header-right {
	position: relative;
	flex-basis: 24px;
	color: var(--theme--foreground-subdued);

	.more {
		cursor: pointer;
		opacity: 0;
		transition: all var(--slow) var(--transition);

		&:hover {
			color: var(--theme--foreground);
		}

		&.active {
			opacity: 1;
		}
	}

	.date {
		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		align-items: center;
		font-size: 12px;
		white-space: nowrap;
		text-align: right;
		opacity: 1;
		transition: opacity var(--slow) var(--transition);
		pointer-events: none;
	}

	.more.active + .date {
		opacity: 0;
	}
}

.item:hover {
	&:hover {
		.header-right .date {
			opacity: 0;
		}

		.header-right .more {
			opacity: 1;
		}
	}
}
</style>
