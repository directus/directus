<template>
	<v-drawer
		v-model="notificationsDrawerOpen"
		icon="notifications"
		:title="t('notifications')"
		@cancel="notificationsDrawerOpen = false"
	>
		<template #actions>
			<v-button
				v-tooltip.bottom="tab[0] === 'inbox' ? t('archive') : t('unarchive')"
				icon
				rounded
				:disabled="selection.length === 0"
				secondary
				@click="toggleArchive"
			>
				<v-icon :name="tab[0] === 'inbox' ? 'archive' : 'move_to_inbox'" />
			</v-button>
		</template>

		<template #sidebar>
			<v-tabs v-model="tab" vertical>
				<v-tab value="inbox">
					<v-list-item-icon>
						<v-icon name="inbox" />
					</v-list-item-icon>
					<v-list-item-content>{{ t('inbox') }}</v-list-item-content>
				</v-tab>
				<v-tab value="archived">
					<v-list-item-icon>
						<v-icon name="archive" />
					</v-list-item-icon>
					<v-list-item-content>{{ t('archive') }}</v-list-item-content>
				</v-tab>
			</v-tabs>
		</template>

		<v-info v-if="!loading && notifications.length === 0" icon="notifications" :title="t('no_notifications')" center>
			{{ t('no_notifications_copy') }}
		</v-info>

		<v-list v-else-if="loading" class="notifications">
			<v-skeleton-loader v-for="i in 10" :key="i" />
		</v-list>

		<v-list v-else class="notifications">
			<v-list-item
				v-for="notification in notifications"
				:key="notification.id"
				block
				:clickable="notification.message"
				@click="toggleNotification(notification.id)"
			>
				<div class="header">
					<v-checkbox
						:model-value="selection.includes(notification.id)"
						@update:model-value="toggleSelected(notification.id)"
					/>
					<div v-tooltip="notification.subject" class="title">{{ notification.subject }}</div>
					<div class="spacer" />
					<div class="time">{{ notification.time }}</div>
					<v-icon
						v-if="notification.to"
						v-tooltip="t('goto_collection_content')"
						clickable
						name="open_in_new"
						@click="onLinkClick(notification.to)"
					/>
					<v-icon
						v-if="notification.message"
						clickable
						:name="openNotifications.includes(notification.id) ? 'expand_less' : 'expand_more'"
					/>
				</div>
				<div
					v-if="openNotifications.includes(notification.id) && notification.message"
					v-md="notification.message"
					class="message"
					@click.stop
				/>
			</v-list-item>
		</v-list>
	</v-drawer>
</template>

<script setup lang="ts">
import api from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { localizedFormatDistance } from '@/utils/localized-format-distance';
import { useAppStore } from '@directus/stores';
import { Notification } from '@directus/types';
import { parseISO } from 'date-fns';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

type LocalNotification = Notification & {
	time: string;
	to?: string;
};

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();
const notificationsStore = useNotificationsStore();
const collectionsStore = useCollectionsStore();

const router = useRouter();

const notifications = ref<LocalNotification[]>([]);
const loading = ref(false);
const error = ref(null);
const selection = ref<string[]>([]);
const tab = ref(['inbox']);
const openNotifications = ref<string[]>([]);

function toggleSelected(id: string) {
	if (selection.value.includes(id)) {
		selection.value.splice(selection.value.indexOf(id), 1);
	} else {
		selection.value.push(id);
	}
}

function toggleNotification(id: string) {
	if (openNotifications.value.includes(id)) {
		openNotifications.value.splice(openNotifications.value.indexOf(id), 1);
	} else {
		openNotifications.value.push(id);
	}
}

const { notificationsDrawerOpen } = storeToRefs(appStore);

fetchNotifications();

watch(tab, () => fetchNotifications());

async function fetchNotifications() {
	loading.value = true;

	try {
		const response = await api.get('/notifications', {
			params: {
				filter: {
					_and: [
						{
							recipient: {
								_eq: userStore.currentUser!.id,
							},
						},
						{
							status: {
								_eq: tab.value[0],
							},
						},
					],
				},
				fields: ['id', 'subject', 'message', 'collection', 'item', 'timestamp'],
				sort: ['-timestamp'],
			},
		});

		await notificationsStore.getUnreadCount();

		const notificationsRaw = response.data.data as Notification[];

		notifications.value = notificationsRaw.map((notification) => {
			let to: string | undefined = undefined;

			if (notification.collection) {
				const collection = collectionsStore.getCollection(notification.collection);

				if (collection?.meta?.singleton) {
					to = `/content/${notification.collection}`;
				} else {
					to = `/content/${notification.collection}/${notification.item}`;
				}
			} else if (String(notification.item).startsWith('/')) {
				to = String(notification.item);
			}

			return {
				...notification,
				time: localizedFormatDistance(parseISO(notification.timestamp), new Date(), {
					addSuffix: true,
				}),
				to,
			};
		});
	} catch (err: any) {
		error.value = err;
	} finally {
		loading.value = false;
	}
}

async function toggleArchive() {
	await api.patch('/notifications', {
		keys: selection.value,
		data: {
			status: tab.value[0] === 'inbox' ? 'archived' : 'inbox',
		},
	});

	await fetchNotifications();

	selection.value = [];
}

function onLinkClick(to: string) {
	router.push(to);

	notificationsDrawerOpen.value = false;
}
</script>

<style lang="scss" scoped>
.v-table {
	display: contents;

	& > :deep(table) {
		min-width: calc(100% - var(--content-padding)) !important;
		margin-left: var(--content-padding);

		tr {
			margin-right: var(--content-padding);
		}
	}
}

.notifications {
	padding: 0px var(--content-padding) var(--content-padding-bottom) var(--content-padding);

	.v-skeleton-loader {
		margin-bottom: 8px;
	}

	.v-list-item {
		&.block {
			height: unset;
			min-height: var(--input-height);
			flex-flow: wrap;
			padding: calc(18px) var(--input-padding) calc(10px) var(--input-padding);
		}

		.header {
			width: 100%;
			display: flex;
			gap: 8px;
			margin-bottom: 8px;

			.title {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: 55%;
			}
			.time {
				color: var(--foreground-subdued);
			}
		}

		.spacer {
			flex-grow: 1;
		}

		.message {
			width: 100%;
			cursor: default;

			&:deep(blockquote) {
				background-color: var(--background-normal);
				padding: 4px 8px;
				margin: 4px 0;
				border-radius: var(--border-radius);
			}
		}
	}
}
</style>
