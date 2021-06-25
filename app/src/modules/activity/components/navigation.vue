<template>
	<v-list large>
		<v-list-item clickable @click="clearNavFilter" :active="!activeFilter">
			<v-list-item-icon>
				<v-icon name="access_time" />
			</v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('all_activity')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item
			clickable
			@click="setNavFilter('user', currentUserID)"
			:active="activeFilter && activeFilter.field === 'user' && activeFilter.value === currentUserID"
		>
			<v-list-item-icon>
				<v-icon name="face" />
			</v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('my_activity')" />
			</v-list-item-content>
		</v-list-item>

		<v-divider />

		<v-list-item
			clickable
			@click="setNavFilter('action', 'create')"
			:active="activeFilter && activeFilter.field === 'action' && activeFilter.value === 'create'"
		>
			<v-list-item-icon>
				<v-icon name="add" />
			</v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('create')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item
			clickable
			@click="setNavFilter('action', 'update')"
			:active="activeFilter && activeFilter.field === 'action' && activeFilter.value === 'update'"
		>
			<v-list-item-icon>
				<v-icon name="check" />
			</v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('update')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item
			clickable
			@click="setNavFilter('action', 'delete')"
			:active="activeFilter && activeFilter.field === 'action' && activeFilter.value === 'delete'"
		>
			<v-list-item-icon>
				<v-icon name="clear" />
			</v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('delete')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item
			clickable
			@click="setNavFilter('action', 'comment')"
			:active="activeFilter && activeFilter.field === 'action' && activeFilter.value === 'comment'"
		>
			<v-list-item-icon>
				<v-icon name="chat_bubble_outline" />
			</v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('comment')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item
			clickable
			@click="setNavFilter('action', 'authenticate')"
			:active="activeFilter && activeFilter.field === 'action' && activeFilter.value === 'authenticate'"
		>
			<v-list-item-icon>
				<v-icon name="login" />
			</v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('login')" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, PropType } from 'vue';
import { useUserStore } from '@/stores/user';
import { nanoid } from 'nanoid';
import { Filter } from '@directus/shared/types';

export default defineComponent({
	emits: ['update:filters'],
	props: {
		filters: {
			type: Array as PropType<Filter[]>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const { t } = useI18n();

		const userStore = useUserStore();
		const currentUserID = computed(() => userStore.currentUser?.id);

		const activeFilter = computed(() => {
			return props.filters.find((filter) => filter.locked === true);
		});

		return { t, currentUserID, setNavFilter, clearNavFilter, activeFilter };

		function setNavFilter(key: string, value: any) {
			emit('update:filters', [
				...props.filters.filter((filter) => {
					return filter.locked === false;
				}),
				{
					key: nanoid(),
					locked: true,
					field: key,
					operator: 'eq',
					value: value,
				},
			]);
		}

		function clearNavFilter() {
			emit(
				'update:filters',
				props.filters.filter((filter) => {
					return filter.locked === false;
				})
			);
		}
	},
});
</script>
