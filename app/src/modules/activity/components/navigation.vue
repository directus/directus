<template>
	<v-list nav>
		<v-list-item to="/activity" exact>
			<v-list-item-icon>
				<v-icon name="access_time" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('all_activity') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item :to="`/activity?action_by=${currentUserID}`" exact>
			<v-list-item-icon>
				<v-icon name="face" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('my_activity') }}
			</v-list-item-content>
		</v-list-item>

		<v-divider />

		<v-list-item to="/activity?action=create" exact>
			<v-list-item-icon>
				<v-icon name="add" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('create') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item to="/activity?action=update" exact>
			<v-list-item-icon>
				<v-icon name="check" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('update') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item to="/activity?action=delete" exact>
			<v-list-item-icon>
				<v-icon name="clear" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('delete') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item to="/activity?action=comment" exact>
			<v-list-item-icon>
				<v-icon name="notes" />
			</v-list-item-icon>
			<v-list-item-content>
				{{ $t('comment') }}
			</v-list-item-content>
		</v-list-item>

		<v-list-item to="/activity?action=authenticate" exact>
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

export default defineComponent({
	setup() {
		const userStore = useUserStore();
		const currentUserID = computed(() => userStore.state.currentUser?.id);

		return { currentUserID };
	},
});
</script>
