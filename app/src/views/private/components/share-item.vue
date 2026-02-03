<script setup lang="ts">
import { Share } from '@directus/types';
import { format } from 'date-fns';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { useItemPermissions } from '@/composables/use-permissions';

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

const { updateAllowed, deleteAllowed } = useItemPermissions('directus_shares', props.share.id, false);

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
				<VMenu show-arrow placement="bottom-end">
					<template #activator="{ toggle, active }">
						<VIcon class="more" :class="{ active }" name="more_horiz" clickable @click="toggle" />
						<div class="date">
							{{ formattedTime }}
						</div>
					</template>

					<VList>
						<VListItem clickable @click="$emit('copy')">
							<VListItemIcon><VIcon name="content_copy" /></VListItemIcon>
							<VListItemContent>{{ $t('share_copy_link') }}</VListItemContent>
						</VListItem>
						<VListItem clickable @click="$emit('invite')">
							<VListItemIcon><VIcon name="send" /></VListItemIcon>
							<VListItemContent>{{ $t('share_send_link') }}</VListItemContent>
						</VListItem>
						<VDivider v-if="deleteAllowed || updateAllowed" />
						<VListItem v-if="updateAllowed" clickable @click="$emit('edit')">
							<VListItemIcon><VIcon name="edit" /></VListItemIcon>
							<VListItemContent>{{ $t('edit') }}</VListItemContent>
						</VListItem>
						<VListItem v-if="deleteAllowed" clickable class="danger" @click="$emit('delete')">
							<VListItemIcon><VIcon name="delete" /></VListItemIcon>
							<VListItemContent>{{ $t('delete_label') }}</VListItemContent>
						</VListItem>
					</VList>
				</VMenu>
			</div>
		</div>

		<div class="item-info">
			<span class="share-uses" :class="{ 'no-left': usesLeft === 0 }">
				<template v-if="usesLeft === null">{{ $t('unlimited_usage') }}</template>
				<template v-else>{{ $t('uses_left', usesLeft) }}</template>
			</span>
			<VIcon v-if="share.password" small name="lock" />
			<span class="spacer"></span>
			<span v-if="status" class="share-status" :class="{ [status]: true }">
				{{ $t(status) }}
			</span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.item {
	margin-block-end: 8px;
	padding: 8px;
	background-color: var(--theme--background);
	border-radius: var(--theme--border-radius);
}

.spacer {
	flex-grow: 1;
}

.item-date {
	color: var(--theme--foreground-subdued);
	font-size: 12px;
}

.item-header {
	display: flex;
	justify-content: space-between;
	margin-block-end: 0;
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
	margin-inline-end: 5px;
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
		inset-block-start: 0;
		inset-inline-end: 0;
		display: flex;
		align-items: center;
		font-size: 12px;
		white-space: nowrap;
		text-align: end;
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
