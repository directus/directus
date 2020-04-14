<template>
	<v-list nav>
		<v-list-item v-for="item in navItems" :to="item.to" :key="item.to">
			<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-list-item-title>{{ item.name }}</v-list-item-title>
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import { i18n } from '@/lang';
import { useProjectsStore } from '@/stores/projects';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = toRefs(projectsStore.state);

		const navItems = [
			{
				icon: 'public',
				name: i18n.t('settings_global'),
				to: `/${currentProjectKey.value}/settings/global`,
			},
			{
				icon: 'list_alt',
				name: i18n.t('settings_data_model'),
				to: `/${currentProjectKey.value}/settings/data-model`,
			},
			{
				icon: 'people',
				name: i18n.t('settings_permissions'),
				to: `/${currentProjectKey.value}/settings/roles`,
			},
			{
				icon: 'send',
				name: i18n.t('settings_webhooks'),
				to: `/${currentProjectKey.value}/settings/webhooks`,
			},
		];

		return { navItems };
	},
});
</script>
