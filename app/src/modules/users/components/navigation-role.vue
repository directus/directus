<template>
	<v-list-item v-context-menu="'contextMenu'" :to="`/users/roles/${role.id}`">
		<v-list-item-icon><v-icon :name="role.icon" /></v-list-item-icon>
		<v-list-item-content>{{ role.name }}</v-list-item-content>

		<v-menu v-if="isAdmin" ref="contextMenu" show-arrow placement="bottom-start">
			<v-list>
				<v-list-item clickable :to="settingLink">
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
import { computed, defineComponent, PropType } from 'vue';
import { useUserStore } from '@/stores/user';
import { BasicRole } from '../composables/use-navigation';

export default defineComponent({
	props: {
		role: {
			type: Object as PropType<BasicRole>,
			required: true,
		},
		lastAdmin: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const { isAdmin } = useUserStore();

		const settingLink = computed(() => {
			return props.role.id !== 'public' && props.lastAdmin
				? {
						name: 'settings-roles-item',
						params: { primaryKey: props.role.id, lastAdminRoleId: props.role.id },
				  }
				: `/settings/roles/${props.role.id}`;
		});

		return { t, isAdmin, settingLink };
	},
});
</script>
