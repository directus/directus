<template>
	<v-list-item v-context-menu="'contextMenu'" :to="`/users/roles/${role.id}`">
		<v-list-item-icon><v-icon :name="role.icon" outline /></v-list-item-icon>
		<v-list-item-content>{{ role.name }}</v-list-item-content>

		<v-menu v-if="isAdmin" ref="contextMenu" show-arrow placement="bottom-start">
			<v-list>
				<v-list-item clickable :to="`/settings/roles/${role.id}`">
					<v-list-item-icon>
						<v-icon name="list_alt" />
					</v-list-item-icon>
					<v-list-item-content>
						<v-text-overflow :text="t('edit_role')" />
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</v-list-item>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';
import { Role } from '@directus/shared/types';
import { useUserStore } from '@/stores';

export default defineComponent({
	props: {
		role: {
			type: Object as PropType<Role>,
			required: true,
		},
	},
	setup() {
		const { t } = useI18n();

		const { isAdmin } = useUserStore();

		return { t, isAdmin };
	},
});
</script>
