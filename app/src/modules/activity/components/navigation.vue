<template>
	<v-list large>
		<v-list-item :active="isEqual(navFilter, null)" @click="setNavFilter(null)">
			<v-list-item-icon>
				<v-icon name="access_time" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('all_activity') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item
			:active="isEqual(navFilter, { user: currentUserID })"
			@click="setNavFilter({ user: currentUserID })"
		>
			<v-list-item-icon>
				<v-icon name="face" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('my_activity') }}
			</v-list-item-content>
		</v-list-item>

		<v-divider />

		<v-list-item :active="isEqual(navFilter, { action: 'create' })" @click="setNavFilter({ action: 'create' })">
			<v-list-item-icon>
				<v-icon name="add" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('create') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item :active="isEqual(navFilter, { action: 'update' })" @click="setNavFilter({ action: 'update' })">
			<v-list-item-icon>
				<v-icon name="check" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('update') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item :active="isEqual(navFilter, { action: 'delete' })" @click="setNavFilter({ action: 'delete' })">
			<v-list-item-icon>
				<v-icon name="clear" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('delete') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item :active="isEqual(navFilter, { action: 'comment' })" @click="setNavFilter({ action: 'comment' })">
			<v-list-item-icon>
				<v-icon name="chat_bubble_outline" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('comment') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item
			:active="isEqual(navFilter, { action: 'authenticate' })"
			@click="setNavFilter({ action: 'authenticate' })"
		>
			<v-list-item-icon>
				<v-icon name="login" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('login') }}
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useUserStore } from '@/stores/user';
import { useNavigation } from '../composables/use-navigation';
import { isEqual } from 'lodash';

export default defineComponent({
	setup() {
		const userStore = useUserStore();
		const currentUserID = computed(() => userStore.state.currentUser?.id);

		const { navFilter } = useNavigation();

		return { currentUserID, setNavFilter, isEqual, navFilter };

		function setNavFilter(filter: Record<string, any> | null) {
			navFilter.value = filter;
		}
	},
});
</script>
