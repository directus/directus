<script setup lang="ts">
import api from '@/api';
import useDatetime from '@/components/use-datetime.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import SearchInput from '@/views/private/components/search-input.vue';
import { useItems } from '@directus/composables';
import { useAppStore } from '@directus/stores';
import { Filter, Notification } from '@directus/types';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

type LocalNotification = Notification & {
	to?: string;
};

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();
const collectionsStore = useCollectionsStore();
const { setUnreadCount } = useNotificationsStore();

const router = useRouter();

const selection = ref<string[]>([]);
const tab = ref(['inbox']);
const openNotifications = ref<string[]>([]);
const page = ref(1);
const limit = ref(25);
const search = ref<string | null>(null);
const userFilter = ref<Filter>({});
const mouseDownTarget = ref<EventTarget | null>(null);

watch(tab, (newTab, oldTab) => {
	if (newTab[0] !== oldTab[0]) {
		page.value = 1;
		selection.value = [];
	}
});

watch([search, userFilter], () => {
	page.value = 1;
});

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

const filter = computed(() => ({
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
		userFilter.value,
	],
}));

const { items, loading, getItems, totalPages, getItemCount } = useItems(ref('directus_notifications'), {
	filter,
	fields: ref(['id', 'subject', 'message', 'collection', 'item', 'timestamp']),
	sort: ref(['-timestamp']),
	search,
	limit,
	page,
});

const notifications = computed<LocalNotification[]>(() => {
	return items.value.map((item) => {
		let to: string | undefined = undefined;

		if (item.collection) {
			const collection = collectionsStore.getCollection(item.collection);

			if (collection?.meta?.singleton || !item.item) {
				to = getCollectionRoute(item.collection);
			} else {
				to = getItemRoute(item.collection, item.item);
			}
		} else if (String(item.item).startsWith('/')) {
			to = String(item.item);
		}

		return {
			...item,
			to,
		} as LocalNotification;
	});
});

async function archiveAll() {
	await api.patch('/notifications', {
		query: {
			recipient: {
				_eq: userStore.currentUser!.id,
			},
		},
		data: {
			status: 'archived',
		},
	});

	await getItemCount();
	await getItems();

	setUnreadCount(0);
}

async function toggleArchive() {
	await api.patch('/notifications', {
		keys: selection.value,
		data: {
			status: tab.value[0] === 'inbox' ? 'archived' : 'inbox',
		},
	});

	await getItemCount();
	await getItems();

	selection.value = [];
}

function onLinkClick(to: string) {
	router.push(to);

	notificationsDrawerOpen.value = false;
}
</script>

<template>
	<v-drawer
		v-model="notificationsDrawerOpen"
		icon="notifications"
		:title="t('notifications')"
		:sidebar-label="t('folders')"
		@cancel="notificationsDrawerOpen = false"
	>
		<template #actions>
			<search-input v-model="search" v-model:filter="userFilter" collection="directus_notifications" />
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
			<v-button
				v-if="tab[0] === 'inbox'"
				v-tooltip.bottom="t('archive_all')"
				icon
				rounded
				:disabled="notifications.length === 0"
				@click="archiveAll"
			>
				<v-icon name="done_all" />
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

		<div v-else class="content">
			<v-list v-if="loading" class="notifications">
				<v-skeleton-loader v-for="i in 10" :key="i" :class="{ dense: totalPages > 1 }" />
			</v-list>

			<v-list v-else class="notifications">
				<v-list-item
					v-for="notification in notifications"
					:key="notification.id"
					block
					:dense="totalPages > 1"
					:clickable="Boolean(notification.message)"
					@mousedown.left.self="({ target }: Event) => (mouseDownTarget = target)"
					@mouseup.left.self="
						({ target }: Event) => {
							if (target === mouseDownTarget) toggleNotification(notification.id);
							mouseDownTarget = null;
						}
					"
				>
					<div class="header" @click="toggleNotification(notification.id)">
						<v-checkbox
							:model-value="selection.includes(notification.id)"
							@update:model-value="toggleSelected(notification.id)"
						/>
						<v-text-overflow class="title" :highlight="search" :text="notification.subject" />
						<use-datetime v-slot="{ datetime }" :value="notification.timestamp" type="timestamp" relative>
							<v-text-overflow class="datetime" :text="datetime" />
						</use-datetime>
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
					/>
				</v-list-item>
			</v-list>
			<v-pagination v-if="totalPages > 1" v-model="page" :total-visible="5" :length="totalPages" />
		</div>
	</v-drawer>
</template>

<style lang="scss" scoped>
.content {
	padding: 0px var(--content-padding) var(--content-padding-bottom) var(--content-padding);
}

.notifications {
	margin-bottom: 16px;
	.v-skeleton-loader {
		margin-bottom: 8px;

		&.dense {
			height: 44px;
		}
	}

	.v-list-item {
		&.block {
			height: unset;
			min-height: var(--input-height);
			flex-flow: wrap;
			padding: 16px var(--input-padding) 16px var(--input-padding);

			&.dense {
				min-height: 44px;
				padding: 10px 8px;
			}
		}

		.header {
			width: 100%;
			display: flex;
			align-items: center;
			gap: 8px;

			.title {
				flex-grow: 1;
			}
			.datetime {
				color: var(--theme--foreground-subdued);
			}
		}

		.message {
			width: 100%;
			margin-top: 8px;
			user-select: text;
			cursor: auto;

			:deep(*) {
				user-select: text;
			}

			:deep() {
				@import '@/styles/markdown';
			}
		}
	}
}
</style>
