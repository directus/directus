<script setup lang="ts">
import { computed } from 'vue';
import { BasicRole } from '../composables/use-navigation';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useUserStore } from '@/stores/user';
import { translate } from '@/utils/translate-literal';

const props = defineProps<{
	role: BasicRole;
	currentRole?: string;
}>();

defineEmits<{
	click: [{ role: string }];
}>();

const { isAdmin } = useUserStore();

const settingLink = computed(() => ({
	name: 'settings-roles-item',
	params: { primaryKey: props.role.id, deleteAllowed: false },
}));
</script>

<template>
	<VListItem
		v-if="role.children === undefined"
		v-context-menu="'contextMenu'"
		scope="role-navigation"
		:active="currentRole === role.id"
		clickable
		@click="$emit('click', { role: role.id })"
	>
		<VListItemIcon><VIcon :name="role.icon" /></VListItemIcon>
		<VListItemContent>{{ translate(role.name) }}</VListItemContent>
	</VListItem>
	<VListGroup
		v-else
		v-context-menu="'contextMenu'"
		clickable
		:active="currentRole === role.id"
		:value="role.id"
		scope="role-navigation"
		@click="$emit('click', { role: role.id })"
	>
		<template #activator>
			<VListItemIcon><VIcon :name="role.icon" /></VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="translate(role.name)" />
			</VListItemContent>
		</template>

		<NavigationRole
			v-for="child in role.children"
			:key="child.id"
			:role="child"
			:current-role="currentRole"
			@click="$emit('click', $event)"
		/>
	</VListGroup>

	<VMenu v-if="isAdmin" ref="contextMenu" show-arrow placement="bottom-start">
		<VList>
			<VListItem clickable :to="settingLink">
				<VListItemIcon>
					<VIcon name="list_alt" />
				</VListItemIcon>
				<VListItemContent>
					<VTextOverflow :text="$t('edit_role')" />
				</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>
