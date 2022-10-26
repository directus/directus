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

		<v-table
			v-else
			v-model="selection"
			v-model:headers="tableHeaders"
			show-select
			:loading="loading"
			:items="notifications"
			item-key="id"
			@click:row="onRowClick"
		>
			<template #[`#item.read`]="{ item }">
				<v-badge dot :class="{ read: item.read }" />
			</template>
		</v-table>
	</v-drawer>
	<v-drawer
		v-model="notificationDetailDrawerOpen"
		icon="notifications"
		:title="viewingNotification.subject"
		@cancel="notificationDetailDrawerOpen = false"
	>
		<template #actions>
			<v-button v-tooltip.bottom="tab[0] === t('back')" icon rounded @click="notificationDetailDrawerOpen = false">
				<v-icon name="check" />
			</v-button>
		</template>
		<div class="drawer-content">
			<p class="message-details">
				{{ viewingNotification.timestampDistance }}
				<span v-if="viewingNotification.sender">&bull; {{ viewingNotification.sender }}</span>
			</p>
			<p class="type-label">{{ t('message') }}</p>
			<div v-md="viewingNotification.message" class="message-value selectable" />
		</div>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { useNotificationsStore } from '@/stores/notifications';
import { useCollectionsStore } from '@/stores/collections';
import { storeToRefs } from 'pinia';
import { Notification } from '@directus/shared/types';
import api from '@/api';
import { Header as TableHeader } from '@/components/v-table/types';
import { Item } from '@directus/shared/types';
import { useRouter } from 'vue-router';
import { parseISO } from 'date-fns';
import { localizedFormatDistance } from '@/utils/localized-format-distance';

export default defineComponent({
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props) {
		const { t } = useI18n();
		const appStore = useAppStore();
		const userStore = useUserStore();
		const notificationsStore = useNotificationsStore();
		const collectionsStore = useCollectionsStore();

		const router = useRouter();

		const notifications = ref<Notification[]>([]);
		const page = ref(0);
		const loading = ref(false);
		const error = ref(null);
		const selection = ref([]);
		const tab = ref(['inbox']);
		const notificationDetailDrawerOpen = ref(false);
		const viewingNotification = ref<(Notification & { timestampDistance: string }) | Record<string, unknown>>({});

		const { notificationsDrawerOpen } = storeToRefs(appStore);

		const tableHeaders = ref<TableHeader[]>([
			{
				text: t('subject'),
				value: 'subject',
				sortable: false,
				width: 250,
				align: 'left',
			},
			{
				text: t('timestamp'),
				value: 'timestampDistance',
				sortable: false,
				width: 170,
				align: 'left',
			},
			{
				text: t('status'),
				value: 'read',
				sortable: false,
				width: 90,
				align: 'center',
			},
		]);

		fetchNotifications();

		watch([() => props.modelValue, tab], () => fetchNotifications());

		return {
			tableHeaders,
			t,
			notificationsDrawerOpen,
			page,
			notifications,
			loading,
			error,
			selection,
			onRowClick,
			toggleArchive,
			tab,
			notificationDetailDrawerOpen,
			viewingNotification,
		};

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
						fields: ['id', 'subject', 'collection', 'item', 'timestamp', 'message', 'read'],
						sort: ['-timestamp'],
					},
				});

				await notificationsStore.getUnreadCount();

				const notificationsRaw = response.data.data as Notification[];

				const notificationsWithRelative: (Notification & { timestampDistance: string })[] = [];

				for (const notification of notificationsRaw) {
					notificationsWithRelative.push({
						...notification,
						timestampDistance: localizedFormatDistance(parseISO(notification.timestamp), new Date(), {
							addSuffix: true,
						}),
					});
				}

				notifications.value = notificationsWithRelative;
			} catch (err: any) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}

		async function toggleArchive() {
			await api.patch('/notifications', {
				keys: selection.value.map(({ id }) => id),
				data: {
					status: tab.value[0] === 'inbox' ? 'archived' : 'inbox',
				},
			});

			await fetchNotifications();

			selection.value = [];
		}

		async function onRowClick({ item }: { item: Notification & { timestampDistance: string }; event: PointerEvent }) {
			// Notification was sent from a collection, send user there
			if (item.collection) {
				const collection = collectionsStore.getCollection(item.collection);

				if (collection?.meta?.singleton) {
					router.push(`/content/${item.collection}`);
				} else {
					router.push(`/content/${item.collection}/${item.item}`);
				}

				notificationsDrawerOpen.value = false;
			}
			// Notification has a message (maybe from an operation), display it
			if (!item.collection) {
				viewingNotification.value = item;
				notificationDetailDrawerOpen.value = true;
			}
			// Set viewed notification as read
			await api.patch(`/notifications/${item.id}`, { read: true });
		}
	},
});
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

.drawer-content {
	margin: 0 var(--content-padding);

	.message-details {
		margin-bottom: var(--content-padding);
	}

	.message-value {
		background-color: var(--background-input);
		border: var(--border-width) solid var(--border-normal);
		border-radius: var(--border-radius);
		padding: var(--input-padding);
	}

	.type-label {
		margin-bottom: 8px;
	}
}

.v-badge.read {
	--v-badge-background-color: var(--background-normal-alt);
}
</style>
