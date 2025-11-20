<script setup lang="ts">
import api from '@/api';
import useDatetime from '@/components/use-datetime.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { formatItemsCountPaginated } from '@/utils/format-items-count';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import SearchInput from '@/views/private/components/search-input.vue';
import { useItems } from '@directus/composables';
import { useAppStore } from '@directus/stores';
import { Filter, Notification } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

type LocalNotification = Notification & {
	to?: string;
};

const { t, n } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();
const collectionsStore = useCollectionsStore();
const notificationsStore = useNotificationsStore();
const router = useRouter();

const collection = ref<string | null>(null);
const selection = ref<string[]>([]);
const confirmDelete = ref(false);
const tab = ref(['inbox']);
const openNotifications = ref<string[]>([]);
const page = ref(1);
const limit = ref(25);
const search = ref<string | null>(null);
const filter = ref<Filter | null>(null);
const mouseDownTarget = ref<EventTarget | null>(null);
const { notificationsDrawerOpen } = storeToRefs(appStore);

watch(tab, (newTab, oldTab) => {
	if (newTab[0] !== oldTab[0]) {
		selection.value = [];
	}
});

watch(notificationsDrawerOpen, (open) => {
	// Load notifications only once the drawer is opened and reset when closed
	collection.value = open ? 'directus_notifications' : null;
});

const filterSystem = computed(
	() =>
		({
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
		}) as Filter,
);

const { items, loading, totalPages, totalCount, itemCount, getItems, getItemCount, getTotalCount } = useItems(
	collection,
	{
		filter: computed(() => mergeFilters(filter.value, filterSystem.value)),
		filterSystem,
		fields: ref(['id', 'subject', 'message', 'collection', 'item', 'timestamp']),
		sort: ref(['-timestamp']),
		search,
		limit,
		page,
	},
);

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

const showingCount = computed(() => {
	// Don't show count if there are no items
	if (!totalCount.value || !itemCount.value) return;

	return formatItemsCountPaginated({
		currentItems: itemCount.value,
		currentPage: page.value,
		perPage: limit.value,
		totalItems: totalCount.value,
		isFiltered: !!filter.value,
		i18n: { t, n },
	});
});

const someItemsSelected = computed(
	() => selection.value.length > 0 && selection.value.length < notifications.value.length,
);

const allItemsSelected = computed(
	() => selection.value.length === notifications.value.length && notifications.value.length > 0,
);

async function refresh() {
	await getItems();
	await getTotalCount();
	await getItemCount();
}

async function selectAll() {
	if (allItemsSelected.value) {
		selection.value = [];
	} else {
		selection.value = notifications.value.map((notification) => notification.id);
	}
}

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

async function toggleArchive() {
	if (selection.value.length === 0) return;

	await api.patch('/notifications', {
		keys: selection.value,
		data: {
			status: tab.value[0] === 'inbox' ? 'archived' : 'inbox',
		},
	});

	await refresh();
	await notificationsStore.refreshUnreadCount();

	selection.value = [];
}

async function deleteSelected() {
	try {
		await api.delete('/notifications', {
			data: {
				keys: selection.value,
			},
		});

		await refresh();
		await notificationsStore.refreshUnreadCount();
	} finally {
		confirmDelete.value = false;
		selection.value = [];
	}
}

function onLinkClick(to: string) {
	router.push(to);

	notificationsDrawerOpen.value = false;
}

function clearFilters() {
	filter.value = null;
	search.value = null;
}
</script>

<template>
	<v-drawer
		v-model="notificationsDrawerOpen"
		icon="notifications"
		:title="$t('notifications')"
		:sidebar-label="$t('folders')"
		@cancel="notificationsDrawerOpen = false"
		@apply="toggleArchive"
	>
		<template #actions:prepend>
			<transition name="fade">
				<span v-if="showingCount" class="item-count">
					{{ showingCount }}
				</span>
			</transition>
		</template>

		<template #actions>
			<search-input v-model="search" v-model:filter="filter" collection="directus_notifications" />

			<v-dialog
				v-model="confirmDelete"
				:disabled="selection.length === 0"
				@esc="confirmDelete = false"
				@apply="deleteSelected"
			>
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="$t('delete_label')"
						rounded
						icon
						class="action-delete"
						secondary
						:disabled="selection.length === 0"
						@click="on"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ $t('cancel') }}
						</v-button>
						<v-button kind="danger" @click="deleteSelected">
							{{ $t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-tooltip.bottom="tab[0] === 'inbox' ? $t('archive') : $t('unarchive')"
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
					<v-list-item-content>{{ $t('inbox') }}</v-list-item-content>
				</v-tab>
				<v-tab value="archived">
					<v-list-item-icon>
						<v-icon name="archive" />
					</v-list-item-icon>
					<v-list-item-content>{{ $t('archive') }}</v-list-item-content>
				</v-tab>
			</v-tabs>
		</template>

		<template v-if="!loading && !itemCount">
			<v-info v-if="filter || search" :title="$t('no_results')" icon="search" center>
				{{ $t('no_results_copy') }}

				<template #append>
					<v-button @click="clearFilters">{{ $t('clear_filters') }}</v-button>
				</template>
			</v-info>

			<v-info v-else icon="notifications" :title="$t('no_notifications')" center>
				{{ $t('no_notifications_copy') }}
			</v-info>
		</template>

		<div v-else class="content">
			<v-list v-if="loading" class="notifications">
				<v-skeleton-loader v-for="i in 10" :key="i" :class="{ dense: totalPages > 1 }" />
			</v-list>

			<div v-else class="notifications-block">
				<v-checkbox
					class="select-all"
					:class="{ dense: totalPages > 1 }"
					:label="!allItemsSelected ? $t('select_all') : $t('deselect_all')"
					:model-value="allItemsSelected"
					:indeterminate="someItemsSelected"
					@update:model-value="selectAll"
				/>

				<v-divider :class="{ dense: totalPages > 1 }" />

				<v-list class="notifications">
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
								v-tooltip="$t('goto_collection_content')"
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
			</div>
			<v-pagination v-if="totalPages > 1" v-model="page" :total-visible="5" :length="totalPages" />
		</div>
	</v-drawer>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.item-count {
	position: relative;
	display: none;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;
	align-self: center;

	@media (width > 640px) {
		display: inline;
	}
}

.content {
	padding: 0 var(--content-padding) var(--content-padding-bottom) var(--content-padding);
}

.notifications {
	margin-block-end: 16px;

	.v-skeleton-loader {
		margin-block-end: 8px;

		&.dense {
			block-size: 44px;
		}
	}

	.v-list-item {
		&.block {
			block-size: unset;
			min-block-size: var(--theme--form--field--input--height);
			flex-flow: wrap;
			padding: 16px var(--theme--form--field--input--padding) 16px var(--theme--form--field--input--padding);

			&.dense {
				min-block-size: 44px;
				padding: 10px 8px;
			}
		}

		.header {
			inline-size: 100%;
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
			inline-size: 100%;
			margin-block-start: 8px;
			cursor: auto;

			:deep() {
				@include mixins.markdown;
			}
		}
	}
}

.select-all {
	display: flex;
	align-items: center;
	justify-content: center;
	block-size: 24px;
	margin: 0 calc(var(--theme--form--field--input--padding) + var(--theme--border-width));

	&.dense {
		margin: 0 calc(8px + var(--theme--border-width)) 12px;
	}
}

.v-divider {
	margin: 8px 0;

	&.dense {
		margin: 4px 0;
	}
}

.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
