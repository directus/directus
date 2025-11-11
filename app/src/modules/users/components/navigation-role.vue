<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';
import { BasicRole } from '../composables/use-navigation';
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
	<v-list-item
		v-if="role.children === undefined"
		v-context-menu="'contextMenu'"
		scope="role-navigation"
		:active="currentRole === role.id"
		clickable
		@click="$emit('click', { role: role.id })"
	>
		<v-list-item-icon><v-icon :name="role.icon" /></v-list-item-icon>
		<v-list-item-content>{{ translate(role.name) }}</v-list-item-content>
	</v-list-item>
	<v-list-group
		v-else
		v-context-menu="'contextMenu'"
		clickable
		:active="currentRole === role.id"
		:value="role.id"
		scope="role-navigation"
		@click="$emit('click', { role: role.id })"
	>
		<template #activator>
			<v-list-item-icon><v-icon :name="role.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="translate(role.name)" />
			</v-list-item-content>
		</template>

		<navigation-role
			v-for="child in role.children"
			:key="child.id"
			:role="child"
			:current-role="currentRole"
			@click="$emit('click', $event)"
		/>
	</v-list-group>

	<v-menu v-if="isAdmin" ref="contextMenu" show-arrow placement="bottom-start">
		<v-list>
			<v-list-item clickable :to="settingLink">
				<v-list-item-icon>
					<v-icon name="list_alt" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow :text="$t('edit_role')" />
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>
