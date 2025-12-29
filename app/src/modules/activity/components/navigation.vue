<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useUserStore } from '@/stores/user';
import { Filter } from '@directus/types';
import { computed } from 'vue';

const props = defineProps<{
	filter?: Filter;
}>();

const emit = defineEmits(['update:filter']);

const userStore = useUserStore();
const currentUserID = computed(() => userStore.currentUser?.id);

const filterField = computed(() => Object.keys(props.filter ?? {})[0] ?? null);
const filterValue = computed(() => Object.values(props.filter ?? {})[0]?._eq ?? null);

function setNavFilter(key: string, value: any) {
	emit('update:filter', {
		[key]: {
			_eq: value,
		},
	});
}

function clearNavFilter() {
	emit('update:filter', null);
}
</script>

<template>
	<VList nav>
		<VListItem clickable :active="!filterField" @click="clearNavFilter">
			<VListItemIcon>
				<VIcon name="access_time" />
			</VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('all_activity')" />
			</VListItemContent>
		</VListItem>

		<VListItem
			clickable
			:active="filterField === 'user' && filterValue === currentUserID"
			@click="setNavFilter('user', currentUserID)"
		>
			<VListItemIcon>
				<VIcon name="face" />
			</VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('my_activity')" />
			</VListItemContent>
		</VListItem>

		<VDivider />

		<VListItem
			clickable
			:active="filterField === 'action' && filterValue === 'create'"
			@click="setNavFilter('action', 'create')"
		>
			<VListItemIcon>
				<VIcon name="add" />
			</VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('create')" />
			</VListItemContent>
		</VListItem>

		<VListItem
			clickable
			:active="filterField === 'action' && filterValue === 'update'"
			@click="setNavFilter('action', 'update')"
		>
			<VListItemIcon>
				<VIcon name="check" />
			</VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('update')" />
			</VListItemContent>
		</VListItem>

		<VListItem
			clickable
			:active="filterField === 'action' && filterValue === 'delete'"
			@click="setNavFilter('action', 'delete')"
		>
			<VListItemIcon>
				<VIcon name="clear" />
			</VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('delete_label')" />
			</VListItemContent>
		</VListItem>

		<VListItem
			clickable
			:active="filterField === 'collection' && filterValue === 'directus_comments'"
			@click="setNavFilter('collection', 'directus_comments')"
		>
			<VListItemIcon>
				<VIcon name="chat_bubble_outline" />
			</VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('comment')" />
			</VListItemContent>
		</VListItem>

		<VListItem
			clickable
			:active="filterField === 'action' && filterValue === 'login'"
			@click="setNavFilter('action', 'login')"
		>
			<VListItemIcon>
				<VIcon name="login" />
			</VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('login')" />
			</VListItemContent>
		</VListItem>
	</VList>
</template>
