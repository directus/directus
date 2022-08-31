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
		></v-table>
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

		const { notificationsDrawerOpen } = storeToRefs(appStore);

		const tableHeaders = ref<TableHeader[]>([
			{
				text: t('subject'),
				value: 'subject',
				sortable: false,
				width: 300,
				align: 'left',
			},
			{
				text: t('timestamp'),
				value: 'timestampDistance',
				sortable: false,
				width: 180,
				align: 'left',
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
						fields: ['id', 'subject', 'collection', 'item', 'timestamp'],
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

		function onRowClick({ item }: { item: Item; event: PointerEvent }) {
			const collection = collectionsStore.getCollection(item.collection);

			if (collection?.meta?.singleton) {
				router.push(`/content/${item.collection}`);
			} else {
				router.push(`/content/${item.collection}/${item.item}`);
			}

			notificationsDrawerOpen.value = false;
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
</style>
